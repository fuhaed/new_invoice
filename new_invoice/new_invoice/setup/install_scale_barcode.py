# ملف: new_invoice/new_invoice/setup/install_scale_barcode.py

import frappe
from frappe.custom.doctype.custom_field.custom_field import create_custom_fields

def install_scale_barcode_fields():
    """إضافة حقول مخصصة لدعم باركود الميزان في POS Profile"""
    
    custom_fields = {
        'POS Profile': [
            {
                'fieldname': 'scale_barcode_section',
                'label': 'إعدادات باركود الميزان',
                'fieldtype': 'Section Break',
                'insert_after': 'print_format',
                'collapsible': 1
            },
            {
                'fieldname': 'enable_scale_barcode',
                'label': 'تفعيل دعم باركود الميزان',
                'fieldtype': 'Check',
                'insert_after': 'scale_barcode_section',
                'default': 0
            },
            {
                'fieldname': 'scale_barcode_prefix',
                'label': 'بادئة باركود الميزان',
                'fieldtype': 'Data',
                'insert_after': 'enable_scale_barcode',
                'default': '99',
                'depends_on': 'eval:doc.enable_scale_barcode==1'
            },
            {
                'fieldname': 'scale_barcode_length',
                'label': 'طول باركود الميزان',
                'fieldtype': 'Int',
                'insert_after': 'scale_barcode_prefix',
                'default': 13,
                'depends_on': 'eval:doc.enable_scale_barcode==1'
            },
            {
                'fieldname': 'scale_barcode_weight_position',
                'label': 'موقع الوزن في الباركود',
                'fieldtype': 'Select',
                'options': 'end\nmiddle',
                'insert_after': 'scale_barcode_length',
                'default': 'end',
                'depends_on': 'eval:doc.enable_scale_barcode==1'
            },
            {
                'fieldname': 'scale_barcode_weight_length',
                'label': 'أطوال أرقام الوزن',
                'fieldtype': 'Int',
                'insert_after': 'scale_barcode_weight_position',
                'default': 5,
                'depends_on': 'eval:doc.enable_scale_barcode==1'
            },
            {
                'fieldname': 'scale_barcode_weight_scale',
                'label': 'مقياس تحويل الوزن',
                'fieldtype': 'Select',
                'options': '1000\n100\n1',
                'insert_after': 'scale_barcode_weight_length',
                'default': '1000',
                'depends_on': 'eval:doc.enable_scale_barcode==1'
            },
            {
                'fieldname': 'scale_barcode_type',
                'label': 'نوع الميزان',
                'fieldtype': 'Select',
                'options': 'standard\ndibal\ncas\ndigi\ncustom',
                'insert_after': 'scale_barcode_weight_scale',
                'default': 'standard',
                'depends_on': 'eval:doc.enable_scale_barcode==1'
            },
            {
                'fieldname': 'scale_barcode_test_section',
                'label': 'اختبار باركود الميزان',
                'fieldtype': 'Section Break',
                'insert_after': 'scale_barcode_type',
                'depends_on': 'eval:doc.enable_scale_barcode==1'
            },
            {
                'fieldname': 'scale_barcode_test',
                'label': 'باركود اختباري',
                'fieldtype': 'Data',
                'insert_after': 'scale_barcode_test_section',
                'description': 'أدخل باركود ميزان لاختبار الإعدادات'
            },
            {
                'fieldname': 'run_scale_barcode_test',
                'label': 'اختبار',
                'fieldtype': 'Button',
                'insert_after': 'scale_barcode_test'
            }
        ]
    }
    
    create_custom_fields(custom_fields)
    frappe.msgprint('تم إضافة حقول دعم باركود الميزان بنجاح')