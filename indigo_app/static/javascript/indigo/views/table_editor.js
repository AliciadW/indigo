(function(exports) {
  "use strict";

  if (!exports.Indigo) exports.Indigo = {};
  Indigo = exports.Indigo;

  // The TableEditorView handles inline editing of tables.
  Indigo.TableEditorView = Backbone.View.extend({
    el: '#content-tab',
    events: {
      'click .table-insert-row-above': 'insertRowAbove',
      'click .table-insert-row-below': 'insertRowBelow',
      'click .table-insert-column-left': 'insertColumnLeft',
      'click .table-insert-column-right': 'insertColumnRight',
      'click .table-delete-row': 'deleteRow',
      'click .table-delete-column': 'deleteColumn',
      'click .table-merge-cells': 'mergeCells',
      'click .table-split-cells': 'splitCells',
      'click .table-toggle-heading': 'toggleHeading',
      'click .table-editor-wrapper .save-edit-table': 'saveEdits',
      'click .table-editor-wrapper .cancel-edit-table': 'cancelEdits',
    },

    initialize: function(options) {
      this.view = options.view;
      this.editor = new TableEditor();
      this.editor.onCellChanged = _.bind(this.cellChanged, this);
      this.tableWrapper = this.$('.table-editor-buttons .table-editor-wrapper').remove()[0];
    },

    saveEdits: function(e) {
      // TODO: transform to XML
      // TODO: replace old node
      // TODO: ensure P tags in td, th
      this.setTable(null);
    },

    cancelEdits: function(e) {
      if (!confirm("You'll lose you changes, are you sure?")) return;

      var table = this.editor.table;
      this.setTable(null);

      // undo changes
      this.editor.table.parentElement.replaceChild(this.initialTable, table);
    },

    setTable: function(table) {
      // TODO: start editing a table
      // TODO: cancel editing other table?
      if (this.editor.table == table)
        return;

      if (table) {
        $(table).closest('.table-editor-wrapper').addClass('table-editor-active');

        // save backup
        this.initialTable = table.cloneNode(true);
        this.editor.setTable(table);

        this.$('.table-editor-buttons').show();
        this.editor.cells[0][0].focus();
      } else {
        this.$('.table-editor-buttons').hide();
        this.editor.$table.closest('.table-editor-wrapper').removeClass('table-editor-active');

        this.editor.setTable(null);
        this.initialTable = null;
      }
    },

    cellChanged: function() {
      $('.table-toggle-heading').toggleClass('active', this.editor.activeCell && this.editor.activeCell.tagName == 'TH');
    },

    insertRowAbove: function() {
      if (!this.editor.activeCell) return;
      this.editor.insertRow(this.editor.activeCoords[1]);
    },

    insertRowBelow: function() {
      if (!this.editor.activeCell) return;
      this.editor.insertRow(this.editor.activeCoords[1] + 1);
    },

    insertColumnLeft: function(e) {
      if (!this.editor.activeCell) return;
      this.editor.insertColumn(this.editor.activeCoords[0]);
    },

    insertColumnRight: function(e) {
      if (!this.editor.activeCell) return;
      this.editor.insertColumn(this.editor.activeCoords[0] + 1);
    },

    deleteRow: function(e) {
      if (!this.editor.activeCell) return;

      this.editor.removeRow(this.editor.activeCoords[1]);
      // TODO update the active cell
    },

    deleteColumn: function(e) {
      if (!this.editor.activeCell) return;

      this.editor.removeColumn(this.editor.activeCoords[0]);
      // update the active cell
    },

    mergeCells: function(e) {
      this.editor.mergeSelection();
    },

    splitCells: function(e) {
      this.editor.splitSelection();
    },

    toggleHeading: function(e) {
      this.editor.toggleHeading();
    },
  });
})(window);
