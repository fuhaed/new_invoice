app_name = "new_invoice"
app_title = "New Invoice"
app_publisher = "Fuhaid"
app_description = "New Invoice"
app_email = "fuahid@gmail.com"
app_license = "mit"

# Includes in <head>
# ------------------
# In hooks.py

# include custom scss in every website theme (without file extension ".scss")
# website_theme_scss = "new_invoice/public/scss/website"

# include js, css files in header of web form
# webform_include_js = {"doctype": "public/js/doctype.js"}
# webform_include_css = {"doctype": "public/css/doctype.css"}

# include js in page
page_js = {"modern-invoice": "public/js/barcode_scanner.js"}

# include js in doctype views
# doctype_js = {"doctype": "public/js/doctype.js"}
# doctype_list_js = {"doctype": "public/js/doctype_list.js"}
# doctype_tree_js = {"doctype": "public/js/doctype_tree.js"}
# doctype_calendar_js = {"doctype": "public/js/doctype_calendar.js"}

# Home Pages
# ----------

# application home page (will override Website Settings)
# home_page = "login"

# website user home page (by Role)
# role_home_page = {
#   "Role": "home_page"
# }

# Generators
# ----------

# automatically create page for each record of this doctype
# website_generators = ["Web Page"]

# Jinja
# ----------

# add methods and filters to jinja environment
# jinja = {
#   "methods": "new_invoice.utils.jinja_methods",
#   "filters": "new_invoice.utils.jinja_filters"
# }

# Installation
# ------------

# before_install = "new_invoice.install.before_install"
# after_install = "new_invoice.install.after_install"

# Uninstallation
# ------------

# before_uninstall = "new_invoice.uninstall.before_uninstall"
# after_uninstall = "new_invoice.uninstall.after_uninstall"

# Desk Notifications
# ------------------
# See frappe.core.notifications.get_notification_config

# notification_config = "new_invoice.notifications.get_notification_config"

# Permissions evaluation
# ---------------------
# Permission evaluation function to be used for checking user permissions
# permission_query_conditions = {
#   "Event": "frappe.desk.doctype.event.event.get_permission_query_conditions",
# }
#
# has_permission = {
#   "Event": "frappe.desk.doctype.event.event.has_permission",
# }

# DocType Class
# ---------------
# Override standard doctype classes

# override_doctype_class = {
#   "ToDo": "custom_app.overrides.CustomToDo"
# }

# Document Events
# ---------------
# Hook on document methods and events

# doc_events = {
#   "*": {
#     "on_update": "method",
#     "on_cancel": "method",
#     "on_trash": "method"
#   }
# }

# Scheduled Tasks
# ---------------

# scheduler_events = {
#   "all": [
#     "new_invoice.tasks.all"
#   ],
#   "daily": [
#     "new_invoice.tasks.daily"
#   ],
#   "hourly": [
#     "new_invoice.tasks.hourly"
#   ],
#   "weekly": [
#     "new_invoice.tasks.weekly"
#   ],
#   "monthly": [
#     "new_invoice.tasks.monthly"
#   ],
# }

# Testing
# -------

# before_tests = "new_invoice.install.before_tests"

# Overriding Methods
# ------------------------------
#
# override_whitelisted_methods = {
#   "frappe.desk.doctype.event.event.get_events": "new_invoice.event.get_events"
# }
#
# each overriding function accepts a `data` argument;
# generated from the base implementation of the doctype dashboard,
# along with any modifications made in other Frappe apps
# override_doctype_dashboards = {
#   "Task": "new_invoice.task.get_dashboard_data"
# }

# exempt linked doctypes from being automatically cancelled
#
# auto_cancel_exempted_doctypes = ["Auto Repeat"]

# Override Sales Invoice Page
override_page_route = [
    {
        "source_route": "point-of-sale",
        "target_route": "modern-invoice"
    }
]

# User Data Protection
# --------------------

# user_data_fields = [
#   {
#     "doctype": "{doctype_1}",
#     "filter_by": "{filter_by}",
#     "redact_fields": ["{field_1}", "{field_2}"],
#     "partial": 1,
#   },
#   {
#     "doctype": "{doctype_2}",
#     "filter_by": "{filter_by}",
#     "partial": 1,
#   },
#   {
#     "doctype": "{doctype_3}",
#     "strict": False,
#   },
#   {
#     "doctype": "{doctype_4}"
#   }
# ]

# Authentication and authorization
# --------------------------------

# auth_hooks = [
#   "new_invoice.auth.validate"
# ]



# Desk links in the sidebar
desk_sidebar_items = [
    {
        "label": "Modern Invoice",
        "route": "/app/modern-invoice", 
        "icon": "fa fa-file-invoice"
    }
]



# إضافة ملفات CSS و JS


