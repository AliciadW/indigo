(function(exports) {
  "use strict";

  if (!exports.Indigo) exports.Indigo = {};
  Indigo = exports.Indigo;

  // django doesn't link blank date fields, send null instead
  function emptyIsNull(val) {
    return (!val || val.trim() === "") ? null : val;
  }

  function bool(val) {
    return val == "1";
  }

  // Handle the document properties form, and saving them back to the server.
  Indigo.DocumentPropertiesView = Backbone.View.extend({
    el: '.document-properties-view',
    workDetailTemplate: '#document-work-template',
    events: {
      'click .btn-amendments': 'showAmendments',
      'click .btn-change-work': 'changeWork',
    },
    bindings: {
      '#document_title': 'title',
      '#document_tags': {
        observe: 'tags',
        getVal: function($el, event, options) {
          return $el.val() || [];
        },
        update: function($el, val, model, options) {
          val = val || [];
          if (!$el.data('select2')) {
            $el.select2();
          }

          // update the valid choices to ensure those we want are there
          $el.select2({data: val});
          // add them
          $el.val(val).trigger('change');
        },
      },
      '#document_expression_date': {
        observe: 'expression_date',
        onSet: emptyIsNull,
        selectOptions: {
          collection: 'this.expressionDates',
        }
      },
      '#document_language': 'language',
      '#document_draft': {
        observe: 'draft',
        onSet: bool,
      },
      '#document_stub': {
        observe: 'stub',
        onSet: bool,
      },
      '#document_updated_at': {
        observe: 'updated_at',
        onGet: function(value, options) {
          if (value) {
            value = moment(value).calendar();
            if (this.model.get('updated_by_user')) {
              value += ' by ' + this.model.get('updated_by_user').display_name;
            }
            return value;
          } else {
            return "";
          }
        }
      },
      '#document_created_at': {
        observe: 'created_at',
        onGet: function(value, options) {
          if (value) {
            value = moment(value).calendar();
            if (this.model.get('created_by_user')) {
              value += ' by ' + this.model.get('created_by_user').display_name;
            }
            return value;
          } else {
            return "";
          }
        }
      },
    },

    initialize: function() {
      // the choices in the expression_date dropdown
      this.expressionDates = new Backbone.Collection();

      this.dirty = false;
      this.model.on('change', this.setDirty, this);
      this.model.on('sync', this.setClean, this);
      this.model.expressionSet.on('change', this.setDirty, this);

      this.model.on('change:draft change:frbr_uri change:language change:expression_date sync', this.showPublishedUrl, this);
      this.model.on('change:country', this.updatePublicationOptions, this);
      this.updatePublicationOptions();

      // update the choices of expression dates when necessary
      this.model.on('change:publication_date', this.matchPublicationExpressionDates, this);
      this.model.on('change:publication_date change:expression_date', this.updateExpressionDates, this);
      this.model.expressionSet.amendments.on('change:date add remove reset', this.updateExpressionDates, this);

      this.workDetailTemplate = Handlebars.compile($(this.workDetailTemplate).html());
      this.model.on('change:work', this.render, this);

      this.updateExpressionDates();
      this.stickit();

      this.render();
    },

    updatePublicationOptions: function() {
      var country = Indigo.countries[this.model.get('country')],
          pubs = (country ? country.publications : []).sort();

      $("#publication_list").empty().append(_.map(pubs, function(pub) {
        var opt = document.createElement("option");
        opt.setAttribute("value", pub);
        return opt;
      }));
    },

    matchPublicationExpressionDates: function(model, new_value) {
      // if the publication date has changed and the expression date
      // matches the old publication date, change the expression date, too
      var old_pub_date = this.model.previous("publication_date");

      if (this.model.get("expression_date") == old_pub_date) {
        this.model.set("expression_date", new_value);
      }

      if (this.model.get("commencement_date") == old_pub_date) {
        this.model.set("commencement_date", new_value);
      }
    },

    updateExpressionDates: function() {
      var dates = this.model.expressionSet.allDates(),
          pubDate = this.model.expressionSet.initialPublicationDate();

      this.expressionDates.set(_.map(dates, function(date) {
        return {
          value: date,
          label: date + ' - ' + (date == pubDate ? 'initial publication' : 'amendment'),
        };
      }), {merge: false});
    },

    showAmendments: function(e) {
      e.preventDefault();
      $('.sidebar a[href="#amendments-tab"]').click();
    },

    changeWork: function() {
      if (!confirm("Are you sure you want to change the work this document is linked to?")) return;

      var document = this.model;
      var chooser = new Indigo.WorkChooserView({});

      chooser.setFilters({country: this.model.get('country')});
      chooser.choose(document.work);
      chooser.showModal().done(function(chosen) {
        if (chosen) {
          document.setWork(chosen);
        }
      });
    },

    showPublishedUrl: function() {
      var url = this.model.manifestationUrl();

      this.$el.find('.published-url').toggle(!this.model.get('draft'));
      this.$el.find('#document_published_url').attr('href', url).text(url);
    },

    setDirty: function() {
      if (!this.dirty) {
        this.dirty = true;
        this.trigger('dirty');
      }
    },

    setClean: function() {
      if (this.dirty) {
        this.dirty = false;
        this.trigger('clean');
      }
    },

    save: function() {
      var self = this;
      // TODO: validation

      // don't do anything if it hasn't changed
      if (!this.dirty) {
        return $.Deferred().resolve();
      }

      // save modified documents using the expression set is sufficient to
      // ensure this document is saved too
      var dirty = this.model.expressionSet.filter(function(d) { return d.dirty; });

      // save the dirty ones and chain the deferreds into a single deferred
      return $.when.apply($, dirty.map(function(d) {
        return d.save();
      })).done(function() {
        self.setClean();
      });
    },

    render: function() {
      var work = this.model.work.toJSON(),
          country = Indigo.countries[work.country];

      work.country_name = country.name;
      work.locality_name = work.locality ? country.localities[work.locality] : null;

      this.$('#document-work-details').html(this.workDetailTemplate({
        work: work,
      }));
    },
  });
})(window);
