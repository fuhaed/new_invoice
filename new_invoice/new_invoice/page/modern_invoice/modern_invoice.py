import frappe
from frappe import _
from frappe.utils import getdate, flt, get_datetime, nowdate
from erpnext.accounts.doctype.sales_invoice.sales_invoice import SalesInvoice
from erpnext.stock.get_item_details import get_item_details

@frappe.whitelist()
def scan_barcode(barcode, pos_profile=None):
    try:
        if not barcode:
            return None
            
        item_code = get_item_code_by_barcode(barcode)
        
        if not item_code:
            if frappe.db.exists("Item", barcode):
                item_code = barcode
            else:
                items = frappe.get_all(
                    "Item", 
                    filters=[["item_code", "like", f"%{barcode}%"]], 
                    fields=["item_code"], 
                    limit=1
                )
                if items:
                    item_code = items[0].item_code
        
        if not item_code:
            return None
            
        price_list = None
        company = frappe.defaults.get_user_default("Company")
        
        if pos_profile:
            pos_profile_doc = frappe.get_doc("POS Profile", pos_profile)
            price_list = pos_profile_doc.selling_price_list
            company = pos_profile_doc.company
        else:
            price_list = frappe.db.get_single_value("Selling Settings", "selling_price_list")
        
        item = frappe.get_doc("Item", item_code)
        
        price = 0
        if price_list:
            item_price = frappe.db.get_value(
                "Item Price",
                {
                    "item_code": item_code,
                    "price_list": price_list,
                    "selling": 1
                },
                "price_list_rate"
            )
            
            if item_price:
                price = item_price
        
        if not price and hasattr(item, "standard_rate"):
            price = item.standard_rate or 0
        
        tax_percent = 0
        if pos_profile:
            tax_details = get_item_tax_details(item_code, pos_profile)
            tax_percent = tax_details.get("tax_percent", 0)
        
        return {
            "item_code": item_code,
            "item_name": item.item_name,
            "rate": price,
            "tax_percent": tax_percent
        }
    
    except Exception as e:
        frappe.log_error(f"Error scanning barcode: {str(e)}")
        return None


def get_item_code_by_barcode(barcode):
    if not barcode:
        return None
        
    barcode_record = frappe.get_all(
        "Item Barcode", 
        filters={"barcode": barcode}, 
        fields=["parent as item_code"],
        limit=1
    )
    
    if barcode_record:
        return barcode_record[0].item_code
    
    return None


def get_item_tax_details(item_code, pos_profile):
    tax_percent = 0
    
    if not item_code or not pos_profile:
        return {"tax_percent": tax_percent}
    
    try:
        pos = frappe.get_doc("POS Profile", pos_profile)
        
        if not hasattr(pos, 'taxes_and_charges') or not pos.taxes_and_charges:
            return {"tax_percent": tax_percent}
        
        tax_template = frappe.get_doc("Sales Taxes and Charges Template", pos.taxes_and_charges)
        
        item_taxes = frappe.get_all(
            "Item Tax",
            filters={"parent": item_code},
            fields=["item_tax_template", "tax_rate"]
        )
        
        if tax_template.taxes:
            if item_taxes:
                for item_tax in item_taxes:
                    for tax in tax_template.taxes:
                        if item_tax.item_tax_template == tax.item_tax_template:
                            tax_percent += flt(item_tax.tax_rate)
                            break
                    if tax_percent > 0:
                        break
            
            if tax_percent == 0:
                for tax in tax_template.taxes:
                    tax_percent += flt(tax.rate)
    except Exception as e:
        frappe.log_error(f"Error getting item tax details: {str(e)}")
    
    return {"tax_percent": tax_percent}


@frappe.whitelist()
def search_items(search_term, pos_profile=None):
    try:
        if not search_term:
            return []
            
        items = frappe.get_all(
            "Item", 
            filters=[
                ["item_name", "like", f"%{search_term}%"],
                ["disabled", "=", 0]
            ],
            or_filters=[
                ["item_code", "like", f"%{search_term}%"],
                ["description", "like", f"%{search_term}%"]
            ],
            fields=["item_code", "item_name", "description", "standard_rate", "image"],
            limit=20
        )
        
        price_list = None
        company = frappe.defaults.get_user_default("Company")
        
        if pos_profile:
            pos_profile_doc = frappe.get_doc("POS Profile", pos_profile)
            price_list = pos_profile_doc.selling_price_list
            company = pos_profile_doc.company
        else:
            price_list = frappe.db.get_single_value("Selling Settings", "selling_price_list")
        
        for item in items:
            if price_list:
                item_price = frappe.db.get_value(
                    "Item Price",
                    {
                        "item_code": item.item_code,
                        "price_list": price_list,
                        "selling": 1
                    },
                    "price_list_rate"
                )
                
                if item_price:
                    item.rate = item_price
                elif item.standard_rate:
                    item.rate = item.standard_rate
                else:
                    item.rate = 0
            elif item.standard_rate:
                item.rate = item.standard_rate
            else:
                item.rate = 0
            
            tax_percent = 0
            if pos_profile:
                tax_details = get_item_tax_details(item.item_code, pos_profile)
                tax_percent = tax_details.get("tax_percent", 0)
            
            item.tax_percent = tax_percent
            
            try:
                warehouse = None
                if pos_profile:
                    pos_doc = frappe.get_doc("POS Profile", pos_profile)
                    warehouse = pos_doc.warehouse
                
                if warehouse:
                    qty = frappe.db.get_value(
                        "Bin", 
                        {"item_code": item.item_code, "warehouse": warehouse}, 
                        "actual_qty"
                    ) or 0
                    item.stock_qty = qty
                else:
                    bins = frappe.get_all(
                        "Bin", 
                        filters={"item_code": item.item_code}, 
                        fields=["sum(actual_qty) as total_qty"]
                    )
                    if bins and bins[0].total_qty:
                        item.stock_qty = bins[0].total_qty
                    else:
                        item.stock_qty = 0
            except Exception as e:
                frappe.log_error(f"Error getting stock qty: {str(e)}")
                item.stock_qty = 0
        
        return items
    
    except Exception as e:
        frappe.log_error(f"Error searching items: {str(e)}")
        return []


@frappe.whitelist()
def get_payment_methods():
    try:
        methods = frappe.get_all("Mode of Payment", fields=["name", "type"])
        
        for method in methods:
            if method.type == "Cash":
                method.icon = "fa-money-bill-alt"
            elif method.type == "Bank":
                method.icon = "fa-university"
            elif method.type == "Card":
                method.icon = "fa-credit-card"
            else:
                method.icon = "fa-money-check"
        
        if not methods:
            frappe.msgprint("No payment methods defined in the system. Please add payment methods in settings.")
        
        return methods
    except Exception as e:
        frappe.log_error(f"Error getting payment methods: {str(e)}")
        return []


def get_payment_account(payment_obj, company):
    account = None
    
    for attr in ['account', 'default_account', 'accounts']:
        if hasattr(payment_obj, attr):
            if attr == 'account' or attr == 'default_account':
                account = getattr(payment_obj, attr)
                break
            elif attr == 'accounts':
                accounts = getattr(payment_obj, attr)
                if accounts:
                    for acc in accounts:
                        if hasattr(acc, 'company') and acc.company == company:
                            if hasattr(acc, 'default_account'):
                                account = acc.default_account
                                break
                    
                    if not account and len(accounts) > 0:
                        first_acc = accounts[0]
                        if hasattr(first_acc, 'default_account'):
                            account = first_acc.default_account
                            break
    
    return account


@frappe.whitelist()
def create_sales_invoice(customer, pos_profile, items, payment_method=None, is_pos=1, invoice_date=None, notes=None):
    try:
        if not customer or not pos_profile or not items:
            frappe.throw(_("Missing required fields"))
        
        if isinstance(items, str):
            items = frappe.parse_json(items)
        
        if not items or len(items) == 0:
            frappe.throw(_("No items in the invoice"))
        
        pos_profile_doc = frappe.get_doc("POS Profile", pos_profile)
        
        customer_info = frappe.get_doc("Customer", customer)
        
        invoice = frappe.new_doc("Sales Invoice")
        
        invoice.customer = customer
        invoice.customer_name = customer_info.customer_name
        invoice.pos_profile = pos_profile
        invoice.company = pos_profile_doc.company
        invoice.selling_price_list = pos_profile_doc.selling_price_list
        
        # Set is_pos based on the payment type
        is_pos = int(is_pos)
        invoice.is_pos = is_pos
        
        if invoice_date:
            invoice.posting_date = getdate(invoice_date)
        else:
            invoice.posting_date = getdate(nowdate())
        
        payment_added = False
        
        # Only add payment details if is_pos is True (cash payment)
        if is_pos and payment_method:
            payment_exists = frappe.db.exists("Mode of Payment", payment_method)
            
            if not payment_exists:
                cash_payment = frappe.db.get_value("Mode of Payment", {"type": "Cash"}, "name")
                if cash_payment:
                    payment_method = cash_payment
                    frappe.msgprint(f"Using payment method {payment_method} instead of the unavailable payment method")
                else:
                    available_payments = frappe.get_all("Mode of Payment", limit=1)
                    if available_payments:
                        payment_method = available_payments[0].name
                        frappe.msgprint(f"Using payment method {payment_method} instead of the unavailable payment method")
                    else:
                        frappe.throw("No payment methods available in the system. Please add payment methods in settings.")
        
            mode_of_payment_account = None
            payment_type = "Cash"
            
            if hasattr(pos_profile_doc, 'payments') and pos_profile_doc.payments:
                for payment in pos_profile_doc.payments:
                    if payment.mode_of_payment == payment_method:
                        mode_of_payment_account = get_payment_account(payment, pos_profile_doc.company)
                        
                        if hasattr(payment, 'type'):
                            payment_type = payment.type
                        
                        if mode_of_payment_account:
                            payment_added = True
                        break
            
            if not payment_added and payment_method:
                try:
                    mode_of_payment_info = frappe.get_doc("Mode of Payment", payment_method)
                    
                    if hasattr(mode_of_payment_info, 'type'):
                        payment_type = mode_of_payment_info.type
                    
                    mode_of_payment_account = get_payment_account(mode_of_payment_info, pos_profile_doc.company)
                    
                    if mode_of_payment_account:
                        payment_added = True
                    
                    if not payment_added:
                        default_cash_account = frappe.get_value(
                            "Company", pos_profile_doc.company, "default_cash_account"
                        )
                        if default_cash_account:
                            mode_of_payment_account = default_cash_account
                            payment_added = True
                except Exception as e:
                    frappe.log_error(f"Error getting payment method: {str(e)}")
                    available_payments = frappe.get_all("Mode of Payment", limit=1)
                    if available_payments:
                        try:
                            payment_method = available_payments[0].name
                            mode_of_payment_info = frappe.get_doc("Mode of Payment", payment_method)
                            mode_of_payment_account = get_payment_account(mode_of_payment_info, pos_profile_doc.company)
                            if mode_of_payment_account:
                                payment_added = True
                        except Exception:
                            pass
        
        invoice.update_stock = pos_profile_doc.update_stock if hasattr(pos_profile_doc, 'update_stock') else 0
        
        invoice.territory = customer_info.territory
        invoice.customer_group = customer_info.customer_group
        
        if hasattr(pos_profile_doc, 'taxes_and_charges') and pos_profile_doc.taxes_and_charges:
            invoice.taxes_and_charges = pos_profile_doc.taxes_and_charges
            tax_template = frappe.get_doc("Sales Taxes and Charges Template", pos_profile_doc.taxes_and_charges)
            for tax in tax_template.taxes:
                invoice.append("taxes", {
                    "charge_type": tax.charge_type,
                    "account_head": tax.account_head,
                    "description": tax.description,
                    "rate": tax.rate,
                    "included_in_print_rate": tax.included_in_print_rate
                })
        
        for item_data in items:
            qty = flt(item_data.get("qty", 1))
            
            price_list_rate = flt(item_data.get("price_list_rate", 0))
            if price_list_rate <= 0:
                price_list_rate = flt(item_data.get("rate", 0))
            
            final_rate = flt(item_data.get("rate", 0))
            discount_amount = flt(item_data.get("discount_amount", 0))
            discount_percentage = flt(item_data.get("discount_percentage", 0))
            
            item_dict = {
                "item_code": item_data.get("item_code"),
                "item_name": item_data.get("item_name", ""),
                "qty": qty,
                "rate": final_rate,
                "amount": final_rate * qty,
                "base_rate": final_rate,
                "price_list_rate": price_list_rate,
                "discount_percentage": discount_percentage,
                "discount_amount": discount_amount
            }
            
            invoice.append("items", item_dict)
        
        if notes:
            invoice.terms = notes
        
        invoice.set_missing_values()
        invoice.calculate_taxes_and_totals()
        
        # Add payment details only for cash payments
        if is_pos and payment_added and mode_of_payment_account:
            invoice.append("payments", {
                "mode_of_payment": payment_method,
                "account": mode_of_payment_account,
                "type": payment_type,
                "amount": invoice.grand_total
            })
            invoice.paid_amount = invoice.grand_total
            invoice.status = "Paid"
        else:
            # For credit (آجل) invoices
            invoice.status = "Unpaid"
        
        invoice.insert()
        
        invoice.reload()
        invoice.calculate_taxes_and_totals()
        invoice.save()
        
        invoice.submit()
        
        return invoice
    
    except Exception as e:
        error_msg = f"Error creating invoice: {str(e)}"
        frappe.log_error(error_msg)
        frappe.throw(error_msg)


@frappe.whitelist()
def get_print_formats():
    return frappe.get_all(
        "Print Format", 
        filters={"doc_type": "Sales Invoice", "disabled": 0},
        fields=["name", "standard"]
    )