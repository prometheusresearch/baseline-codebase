#
# Copyright (c) 2017, Prometheus Research, LLC
#

from .extension import ExportFormatter

__all__ = ('CSVExportFormatter', 'HTMLExportFormatter',)

class CSVExportFormatter(ExportFormatter):
    mimetype = 'text/csv'
    label = 'CSV'
    extension = 'csv'

class HTMLExportFormatter(ExportFormatter):
    mimetype = 'text/html'
    label = 'HTML'
    extension = 'html'
