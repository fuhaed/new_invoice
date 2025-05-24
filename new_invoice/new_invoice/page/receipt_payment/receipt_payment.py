from __future__ import unicode_literals
import frappe
from frappe.utils import getdate, flt, today, cint
from frappe import _
import json

def get_payment_mode_account_details(mode_of_payment, company):
   account = frappe.db.get_value("Mode of Payment Account", 
       {"parent": mode_of_payment, "company": company}, 
       "default_account")
   
   if not account:
       frappe.throw(_("Default account not found for mode of payment {0} in company {1}").format(
           mode_of_payment, company))
   
   return {
       "account": account
   }

@frappe.whitelist()
def create_payment_entry(party_type, party, mode_of_payment=None, bank_account=None, amount=0, 
                       payment_date=None, reference_no=None, reference_date=None, description=None):
   try:
       if not frappe.has_permission("Payment Entry", "create"):
           frappe.throw(_("You don't have permission to create Payment Entry"))
           
       if not party:
           frappe.throw(_("Party is required"))
       
       if not payment_date:
           payment_date = today()
           
       if flt(amount) <= 0:
           frappe.throw(_("Amount must be greater than zero"))
       
       if mode_of_payment:
           mode_doc = frappe.get_doc("Mode of Payment", mode_of_payment)
           if mode_doc.type == 'Bank':
               if not reference_no:
                   frappe.throw(_("Reference No is mandatory for Bank transaction"))
               if not reference_date:
                   frappe.throw(_("Reference Date is mandatory for Bank transaction"))
           
       pe = frappe.new_doc("Payment Entry")
       pe.payment_type = "Receive"
       pe.party_type = party_type
       pe.party = party
       pe.posting_date = payment_date
       pe.company = frappe.defaults.get_user_default("Company")
       
       pe.reference_no = reference_no
       pe.reference_date = reference_date or payment_date
       pe.remarks = description
       
       if mode_of_payment:
           pe.mode_of_payment = mode_of_payment
           payment_mode_account_details = get_payment_mode_account_details(mode_of_payment, pe.company)
           if payment_mode_account_details:
               pe.paid_to = payment_mode_account_details.get("account")
       
       if bank_account:
           pe.paid_to = bank_account
       
       pe.received_amount = flt(amount)
       pe.paid_amount = flt(amount)
       
       pe.setup_party_account_field()
       pe.set_missing_values()
       pe.set_exchange_rate()
       pe.set_amounts()
       
       pe.flags.ignore_permissions = True
       pe.insert()
       
       pe.docstatus = 1
       pe.save()
       
       frappe.db.commit()
       
       return pe.as_dict()
   
   except frappe.exceptions.TimestampMismatchError:
       if pe.name:
           frappe.db.commit()
           return frappe.get_doc("Payment Entry", pe.name).as_dict()
       else:
           frappe.log_error(frappe.get_traceback(), _("Payment Entry Creation Failed"))
           frappe.throw(_("Error creating payment entry. Please try again."))
   except frappe.PermissionError:
       frappe.log_error(frappe.get_traceback(), _("Payment Entry Permission Denied"))
       frappe.throw(_("You don't have permission to create Payment Entry"))
   except frappe.ValidationError as e:
       frappe.log_error(frappe.get_traceback(), _("Payment Entry Validation Failed"))
       frappe.throw(_("Validation error: {0}").format(str(e)))
   except Exception as e:
       frappe.log_error(frappe.get_traceback(), _("Payment Entry Creation Failed"))
       frappe.throw(_("Error creating payment entry: {0}").format(str(e)))

@frappe.whitelist()
def get_payment_methods():
   try:
       methods = frappe.get_all("Mode of Payment", fields=["name", "mode_of_payment", "type", "arabic_name"])
       
       payment_modes = []
       for method in methods:
           display_name = method.arabic_name if frappe.local.lang == "ar" and hasattr(method, "arabic_name") and method.arabic_name else method.mode_of_payment or method.name
           payment_modes.append({
               "name": method.mode_of_payment or method.name,
               "display_name": display_name,
               "type": method.type if method.type else 'Cash',
               "requires_reference": method.type == 'Bank'
           })
       
       return payment_modes
   except Exception as e:
       frappe.logger().error(f"Error getting payment methods: {str(e)}")
       return []

@frappe.whitelist()
def get_payment_modes():
   try:
       methods = frappe.get_all("Mode of Payment", fields=["name", "mode_of_payment", "type", "arabic_name"])
       
       payment_modes = []
       for method in methods:
           display_name = method.arabic_name if frappe.local.lang == "ar" and hasattr(method, "arabic_name") and method.arabic_name else method.mode_of_payment or method.name
           payment_modes.append({
               "name": method.mode_of_payment or method.name,
               "display_name": display_name,
               "type": method.type if method.type else 'Cash',
               "requires_reference": method.type == 'Bank'
           })
       
       return payment_modes
   except Exception as e:
       frappe.logger().error("Error in get_payment_modes: %s", frappe.get_traceback())
       return []

@frappe.whitelist()
def get_payment_modes_from_pos():
   try:
       pos_profiles = frappe.get_all("POS Profile", fields=["name"])
       
       if not pos_profiles:
           frappe.logger().warning("No POS profiles found")
           return get_payment_modes()
       
       pos_profile = frappe.get_doc("POS Profile", pos_profiles[0].name)
       
       payment_modes = []
       if hasattr(pos_profile, 'payments') and pos_profile.payments:
           for payment in pos_profile.payments:
               mode_doc = frappe.get_doc("Mode of Payment", payment.mode_of_payment)
               display_name = mode_doc.arabic_name if frappe.local.lang == "ar" and hasattr(mode_doc, "arabic_name") and mode_doc.arabic_name else mode_doc.mode_of_payment
               payment_modes.append({
                   "name": mode_doc.mode_of_payment,
                   "display_name": display_name,
                   "type": mode_doc.type if mode_doc.type else 'Cash',
                   "requires_reference": mode_doc.type == 'Bank'
               })
       
       if not payment_modes:
           return get_payment_modes()
           
       frappe.logger().info("Payment modes retrieved from POS: %s", payment_modes)
       return payment_modes
   except Exception as e:
       frappe.logger().error("Error getting payment modes from POS: %s", frappe.get_traceback())
       return get_payment_modes()

@frappe.whitelist()
def get_payment_modes_from_pos_profile(pos_profile):
    try:
        if not pos_profile:
            return []
        
        profile_doc = frappe.get_doc("POS Profile", pos_profile)
        
        unique_payment_modes = {}
        
        if hasattr(profile_doc, 'payments') and profile_doc.payments:
            for payment in profile_doc.payments:
                try:
                    mode_doc = frappe.get_doc("Mode of Payment", payment.mode_of_payment)
                    display_name = mode_doc.arabic_name if frappe.local.lang == "ar" and hasattr(mode_doc, "arabic_name") and mode_doc.arabic_name else mode_doc.mode_of_payment
                    
                    unique_payment_modes[mode_doc.mode_of_payment] = {
                        "name": mode_doc.mode_of_payment,
                        "display_name": display_name,
                        "type": mode_doc.type if mode_doc.type else 'Cash',
                        "requires_reference": mode_doc.type == 'Bank'
                    }
                except Exception as e:
                    frappe.logger().error(f"Error getting payment mode: {str(e)}")
        
        if not unique_payment_modes:
            return get_payment_modes()
            
        frappe.logger().info(f"Payment modes retrieved from POS profile {pos_profile}: {unique_payment_modes}")
        
        return list(unique_payment_modes.values())
    except Exception as e:
        frappe.logger().error(f"Error getting payment modes from POS profile {pos_profile}: {frappe.get_traceback()}")
        return []

@frappe.whitelist()
def diagnose_payment_modes():
   try:
       table_exists = frappe.db.sql("""
           SELECT 1 FROM information_schema.tables 
           WHERE table_name = 'tabMode of Payment'
       """, as_dict=True)
       
       if table_exists:
           columns = frappe.db.sql("""
               SELECT column_name 
               FROM information_schema.columns 
               WHERE table_name = 'tabMode of Payment'
           """, as_dict=True)
           
           count = frappe.db.sql("""
               SELECT COUNT(*) as count 
               FROM `tabMode of Payment`
           """, as_dict=True)[0].get('count')
           
           modes = frappe.db.sql("""
               SELECT name, mode_of_payment 
               FROM `tabMode of Payment` 
               LIMIT 10
           """, as_dict=True)
           
           return {
               "success": True,
               "table_exists": bool(table_exists),
               "columns": [c.get('column_name') for c in columns],
               "count": count,
               "sample_modes": modes
           }
       else:
           return {
               "success": False,
               "error": "Table 'tabMode of Payment' does not exist",
               "table_exists": False
           }
   except Exception as e:
       frappe.logger().error("Diagnostic error: %s", frappe.get_traceback())
       return {
           "success": False,
           "error": str(e),
           "traceback": frappe.get_traceback()
       }

@frappe.whitelist()
def debug_payment_modes():
   try:
       all_modes = frappe.get_all('Mode of Payment', 
                                 fields=['name', 'mode_of_payment', 'type', 'disabled', 'arabic_name'],
                                 order_by='name')
       
       enabled_modes = frappe.get_all('Mode of Payment', 
                                     fields=['name', 'mode_of_payment', 'type', 'disabled', 'arabic_name'],
                                     filters={'disabled': 0},
                                     order_by='name')
       
       has_permission = frappe.has_permission('Mode of Payment', 'read')
       
       return {
           "success": True,
           "all_modes": all_modes,
           "enabled_modes": enabled_modes,
           "has_permission": has_permission,
           "username": frappe.session.user
       }
   except Exception as e:
       frappe.logger().error("Debug payment modes error: %s", frappe.get_traceback())
       return {
           "success": False,
           "error": str(e),
           "traceback": frappe.get_traceback()
       }

@frappe.whitelist()
def test_payment_api():
   return {"status": "success", "modes": frappe.get_all("Mode of Payment", fields=["name", "mode_of_payment"])}

@frappe.whitelist()
def enable_all_payment_modes():
   try:
       disabled_modes = frappe.db.get_all('Mode of Payment', 
                                        filters={'disabled': 1}, 
                                        fields=['name'])
       
       count = 0
       for mode in disabled_modes:
           doc = frappe.get_doc('Mode of Payment', mode.name)
           doc.disabled = 0
           doc.save()
           count += 1
       
       frappe.db.commit()
       
       return {
           "success": True,
           "message": f"تم تفعيل {count} طرق دفع بنجاح"
       }
   except Exception as e:
       frappe.logger().error("Error enabling payment modes: %s", frappe.get_traceback())
       return {
           "success": False,
           "error": str(e)
       }

@frappe.whitelist()
def get_customer_balance(customer):
   if not customer:
       return {"balance": 0}
   
   try:
       from erpnext.accounts.utils import get_balance_on
       from erpnext.accounts.party import get_party_account
       
       company = frappe.defaults.get_user_default("Company")
       party_account = get_party_account("Customer", customer, company)
       
       if party_account:
           balance = get_balance_on(account=party_account, party_type="Customer", party=customer)
           return {"balance": balance}
       
       doc = frappe.get_doc("Customer", customer)
       if hasattr(doc, "outstanding_amount"):
           return {"balance": doc.outstanding_amount}
           
       return {"balance": 0}
   except Exception as e:
       frappe.logger().error(f"Error getting customer balance: {str(e)}")
       return {"balance": 0, "error": str(e)}

@frappe.whitelist()
def get_bank_accounts():
   if not frappe.has_permission("Account", "read"):
       frappe.throw(_("You don't have permission to access bank accounts"))
       
   company = frappe.defaults.get_user_default("Company")
   
   bank_accounts = frappe.get_all("Account", 
       fields=["name", "account_name"],
       filters={
           "company": company,
           "account_type": "Bank",
           "is_group": 0,
           "disabled": 0
       },
       order_by="account_name")
   
   return bank_accounts

@frappe.whitelist()
def get_recent_payment_entries(limit=10):
   if not frappe.has_permission("Payment Entry", "read"):
       frappe.throw(_("You don't have permission to view Payment Entries"))
       
   payments = frappe.get_list("Payment Entry",
       fields=["name", "posting_date", "payment_type", "party_type", "party", "party_name", 
               "paid_amount", "status", "docstatus", "creation"],
       filters={"payment_type": "Receive"},
       order_by="creation desc",
       limit_page_length=cint(limit)
   )
   
   return payments

@frappe.whitelist()
def troubleshoot_payment_modes():
   try:
       mode_count = frappe.db.count('Mode of Payment')
       
       enabled_modes = frappe.db.count('Mode of Payment', {'disabled': 0})
       
       pos_count = frappe.db.count('POS Profile', {'disabled': 0})
       
       pos_profile = None
       if pos_count > 0:
           pos_profiles = frappe.get_all("POS Profile", 
                                    filters={"disabled": 0},
                                    fields=["name"],
                                    limit=1)
           if pos_profiles:
               pos_profile = frappe.get_doc("POS Profile", pos_profiles[0].name)
       
       has_permission = frappe.has_permission('Mode of Payment', 'read')
       
       return {
           "success": True,
           "mode_of_payment_count": mode_count,
           "enabled_modes_count": enabled_modes,
           "pos_profile_count": pos_count,
           "pos_profile_sample": pos_profile.name if pos_profile else None,
           "pos_payments_count": len(pos_profile.payments) if pos_profile and hasattr(pos_profile, 'payments') else 0,
           "has_permission": has_permission,
           "username": frappe.session.user
       }
   except Exception as e:
       frappe.logger().error("Troubleshooting error: %s", frappe.get_traceback())
       return {
           "success": False,
           "error": str(e),
           "traceback": frappe.get_traceback()
       }

@frappe.whitelist()
def improved_get_payment_modes():
    try:
        payment_modes = get_payment_methods()
        
        unique_payment_modes = {}
        
        for mode in payment_modes:
            unique_payment_modes[mode["name"]] = mode
            
        if unique_payment_modes:
            return list(unique_payment_modes.values())
        
        pos_profiles = frappe.get_all("POS Profile", fields=["name"])
        
        if pos_profiles:
            for profile in pos_profiles:
                try:
                    profile_doc = frappe.get_doc("POS Profile", profile.name)
                    if hasattr(profile_doc, 'payments') and profile_doc.payments:
                        for payment in profile_doc.payments:
                            try:
                                mode_doc = frappe.get_doc("Mode of Payment", payment.mode_of_payment)
                                display_name = mode_doc.arabic_name if frappe.local.lang == "ar" and hasattr(mode_doc, "arabic_name") and mode_doc.arabic_name else mode_doc.mode_of_payment
                                
                                unique_payment_modes[mode_doc.mode_of_payment] = {
                                    "name": mode_doc.mode_of_payment,
                                    "display_name": display_name,
                                    "type": mode_doc.type if hasattr(mode_doc, 'type') and mode_doc.type else 'Cash',
                                    "requires_reference": hasattr(mode_doc, 'type') and mode_doc.type == 'Bank'
                                }
                            except Exception as e:
                                frappe.logger().error(f"Error getting mode '{payment.mode_of_payment}': {str(e)}")
                except Exception as e:
                    frappe.logger().error(f"Error processing POS profile '{profile.name}': {str(e)}")
        
        return list(unique_payment_modes.values())
    except Exception as e:
        frappe.logger().error(f"Error in improved_get_payment_modes: {str(e)}\n{frappe.get_traceback()}")
        return []