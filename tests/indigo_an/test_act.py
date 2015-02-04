from unittest import TestCase
from nose.tools import *

from indigo_an.act import Act

class ActTestCase(TestCase):
    def test_empty_act(self):
        a = Act()
        assert_equal(a.title, "Untitled")
        assert_is_not_none(a.meta)
        assert_is_not_none(a.body)

    def test_frbr_uri(self):
        a = Act()
        a.frbr_uri = '/za/act/2007/01'
        assert_equal(a.frbr_uri, '/za/act/2007/01/')
        assert_equal(a.meta.identification.FRBRExpression.FRBRuri.get('value'), '/za/act/2007/01/eng@')
        assert_equal(a.meta.identification.FRBRManifestation.FRBRuri.get('value'), '/za/act/2007/01/eng@')

    def test_work_date(self):
        a = Act()
        a.work_date = '2012-01-02'
        assert_equal(a.work_date, '2012-01-02')

    def test_expression_date(self):
        a = Act()
        a.expression_date = '2012-01-02'
        assert_equal(a.expression_date, '2012-01-02')

    def test_manifestation_date(self):
        a = Act()
        a.manifestation_date = '2012-01-02'
        assert_equal(a.manifestation_date, '2012-01-02')