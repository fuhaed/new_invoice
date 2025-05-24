frappe.pages['receipt-payment'].on_page_load = function(wrapper) {
  var page = frappe.ui.make_app_page({
    parent: wrapper,
    title: 'سند قبض',
    single_column: true
  });
 
  window.voucher_translations = {
    "en": {
      "customer": "Customer",
      "payment_method": "Payment Method",
      "amount": "Amount",
      "create": "Create Receipt",
      "loading_payments": "Loading payment methods...",
      "no_payment_methods": "No payment methods defined.",
      "select_customer": "Please select a customer",
      "select_payment": "Please select a payment method",
      "enter_valid_amount": "Please enter a valid amount",
      "creating_voucher": "Creating receipt...",
      "receipt_created": "Receipt created successfully: ",
      "creation_failed": "Failed to create receipt: ",
      "confirm_create": "Are you sure you want to create this receipt?",
      "customer_balance": "Current Balance",
      "recent_receipts": "Recent Receipts",
      "receipt_number": "Receipt No.",
      "date": "Date",
      "amount": "Amount",
      "status": "Status",
      "action": "Action",
      "print": "Print",
      "close": "Close",
      "no_receipts_found": "No recent receipts found",
      "reference_no": "Reference No",
      "reference_date": "Reference Date"
    },
    "ar": {
      "customer": "العميل",
      "payment_method": "طريقة الدفع",
      "amount": "المبلغ",
      "create": "إنشاء سند",
      "loading_payments": "جاري تحميل طرق الدفع...",
      "no_payment_methods": "لا توجد طرق دفع محددة.",
      "select_customer": "الرجاء اختيار العميل",
      "select_payment": "الرجاء اختيار طريقة الدفع",
      "enter_valid_amount": "الرجاء إدخال مبلغ صحيح",
      "creating_voucher": "جاري إنشاء سند القبض...",
      "receipt_created": "تم إنشاء سند القبض بنجاح: ",
      "creation_failed": "فشل إنشاء سند القبض: ",
      "confirm_create": "هل أنت متأكد من إنشاء سند القبض؟",
      "customer_balance": "الرصيد الحالي",
      "recent_receipts": "السندات الأخيرة",
      "receipt_number": "رقم السند",
      "date": "التاريخ",
      "amount": "المبلغ",
      "status": "الحالة",
      "action": "الإجراء",
      "print": "طباعة",
      "close": "إغلاق",
      "no_receipts_found": "لا توجد سندات حديثة",
      "reference_no": "رقم المرجع",
      "reference_date": "تاريخ المرجع"
    }
  };
 
  function get_text(key) {
    const user_language = frappe.boot.user.language || "en";
    if (user_language === "ar" && window.voucher_translations.ar[key]) {
      return window.voucher_translations.ar[key];
    }
    return window.voucher_translations.en[key];
  }
 
  $(page.main).html(`
    <div class="container mt-4">
      <div class="row">
        <div class="col-lg-6">
          <div class="card shadow mb-4">
            <div class="card-header bg-primary text-white">
              <h4 class="mb-0">سند قبض جديد</h4>
            </div>
            <div class="card-body">
              <div class="form-group mb-4">
                <div id="party_field"></div>
              </div>
              
              <div class="form-group mb-4" id="balance_container" style="display: none;">
                <label for="customer_balance">${get_text("customer_balance")}</label>
                <div class="input-group">
                  <div class="form-control" id="customer_balance">0.00</div>
                </div>
              </div>
              
              <div class="form-group mb-4">
                <label for="payment_method">${get_text("payment_method")}</label>
                <div class="payment-method-container">
                  <div class="text-center py-2">
                    <i class="fa fa-spinner fa-spin"></i> ${get_text("loading_payments")}
                  </div>
                </div>
              </div>
              
              <div class="form-group mb-4" id="reference_no_container" style="display: none;">
                <div id="reference_no_field"></div>
              </div>
              
              <div class="form-group mb-4" id="reference_date_container" style="display: none;">
                <div id="reference_date_field"></div>
              </div>
              
              <div class="form-group mb-4">
                <div id="amount_field"></div>
              </div>
              
              <div class="form-group mt-5">
                <button class="btn btn-primary btn-lg btn-block w-100 py-3" id="create_voucher_btn">
                  <i class="fa fa-save mr-2"></i> ${get_text("create")}
                </button>
              </div>
              
              <div id="result_message" class="alert mt-3" style="display: none;"></div>
            </div>
          </div>
        </div>
        
        <div class="col-lg-6">
          <div class="card shadow">
            <div class="card-header bg-info text-white">
              <h4 class="mb-0">${get_text("recent_receipts")}</h4>
            </div>
            <div class="card-body p-0">
              <div class="table-responsive">
                <table class="table table-bordered table-hover mb-0" id="recent_receipts_table">
                  <thead>
                    <tr>
                      <th>${get_text("receipt_number")}</th>
                      <th>${get_text("date")}</th>
                      <th>${get_text("amount")}</th>
                      <th>${get_text("status")}</th>
                      <th>${get_text("action")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td colspan="5" class="text-center py-3">
                        <i class="fa fa-spinner fa-spin"></i> ${get_text("loading_payments")}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="modal fade" id="print_dialog" tabindex="-1" role="dialog">
      <div class="modal-dialog modal-lg" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">${get_text("print")}</h5>
            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div class="modal-body" id="print_content">
            <div class="text-center py-5">
              <i class="fa fa-spinner fa-spin fa-3x"></i>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-dismiss="modal">${get_text("close")}</button>
            <button type="button" class="btn btn-primary" id="print_btn">
              <i class="fa fa-print"></i> ${get_text("print")}
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <iframe id="print_frame" name="print_frame" style="display: none;"></iframe>
  `);
  
  $(`<style>
    .payment-methods-grid {
      margin-top: 10px;
    }
    .payment-method-card {
      padding: 12px;
      border: 1px solid #ddd;
      border-radius: 5px;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .payment-method-card:hover {
      border-color: #5e64ff;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    .payment-method-card.selected {
      background-color: #eef0ff;
      border-color: #5e64ff;
      font-weight: bold;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    .customer-balance {
      text-align: right;
      font-weight: bold;
      font-size: 16px;
      direction: ltr;
    }
    .negative-balance {
      color: #dc3545;
    }
    .positive-balance {
      color: #28a745;
    }
  </style>`).appendTo('head');
 
  class SimpleReceiptController {
    constructor(page) {
      this.page = page;
      this.page_wrapper = $(this.page.wrapper);
      this.party = null;
      this.payment_method = null;
      this.payment_method_type = null;
      this.amount = 0;
      this.reference_no = '';
      this.reference_date = '';
      this.payment_modes = [];
      
      this.initialize();
    }
    
    initialize() {
      this.setup_fields();
      this.load_payment_modes();
      this.load_recent_receipts();
      this.bind_events();
    }
    
    setup_fields() {
      let me = this;
      
      this.party_field = frappe.ui.form.make_control({
        parent: this.page_wrapper.find('#party_field'),
        df: {
          fieldtype: 'Link',
          options: 'Customer',
          label: get_text("customer"),
          fieldname: 'party',
          placeholder: get_text("customer") + '...',
          reqd: 1,
          get_query: function() {
            return {
              filters: { disabled: 0 }
            };
          },
          onchange: function() {
            if (this.value) {
              me.party = this.value;
              me.get_customer_balance(this.value);
            } else {
              me.party = null;
              me.page_wrapper.find('#balance_container').hide();
            }
          }
        },
        render_input: true
      });
      
      this.reference_no_field = frappe.ui.form.make_control({
        parent: this.page_wrapper.find('#reference_no_field'),
        df: {
          fieldtype: 'Data',
          label: get_text("reference_no"),
          fieldname: 'reference_no',
          placeholder: get_text("reference_no") + '...',
          reqd: 1,
          onchange: function() {
            me.reference_no = this.value || '';
          }
        },
        render_input: true
      });
      
      this.reference_date_field = frappe.ui.form.make_control({
        parent: this.page_wrapper.find('#reference_date_field'),
        df: {
          fieldtype: 'Date',
          label: get_text("reference_date"),
          fieldname: 'reference_date',
          placeholder: get_text("reference_date") + '...',
          reqd: 1,
          default: frappe.datetime.get_today(),
          onchange: function() {
            me.reference_date = this.value || '';
          }
        },
        render_input: true
      });
      
      this.amount_field = frappe.ui.form.make_control({
        parent: this.page_wrapper.find('#amount_field'),
        df: {
          fieldtype: 'Currency',
          label: get_text("amount"),
          fieldname: 'amount',
          placeholder: get_text("amount") + '...',
          reqd: 1,
          default: 0,
          onchange: function() {
            me.amount = this.value || 0;
          }
        },
        render_input: true
      });
      
      this.party_field.refresh();
      this.reference_no_field.refresh();
      this.reference_date_field.refresh();
      this.amount_field.refresh();
    }
    
    toggle_reference_fields(requires_reference) {
      if (requires_reference) {
        this.page_wrapper.find('#reference_no_container').show();
        this.page_wrapper.find('#reference_date_container').show();
        this.reference_no_field.df.reqd = 1;
        this.reference_date_field.df.reqd = 1;
      } else {
        this.page_wrapper.find('#reference_no_container').hide();
        this.page_wrapper.find('#reference_date_container').hide();
        this.reference_no_field.df.reqd = 0;
        this.reference_date_field.df.reqd = 0;
      }
      
      this.reference_no_field.refresh();
      this.reference_date_field.refresh();
    }
    
    get_customer_balance(customer_name) {
      let me = this;
      
      if (!customer_name) {
        me.page_wrapper.find('#balance_container').hide();
        return;
      }
      
      me.page_wrapper.find('#customer_balance').html('<i class="fa fa-spinner fa-spin"></i>');
      me.page_wrapper.find('#balance_container').show();
      
      frappe.call({
        method: 'new_invoice.new_invoice.page.receipt_payment.receipt_payment.get_customer_balance',
        args: {
          customer: customer_name
        },
        callback: function(r) {
          if (r.message) {
            const balance = r.message.balance || 0;
            const formattedBalance = format_currency(Math.abs(balance));
            const balanceHtml = `<span class="customer-balance ${balance >= 0 ? 'positive-balance' : 'negative-balance'}">${balance >= 0 ? '' : '-'}${formattedBalance}</span>`;
            me.page_wrapper.find('#customer_balance').html(balanceHtml);
          } else {
            me.page_wrapper.find('#customer_balance').text('0.00');
          }
        },
        error: function() {
          me.page_wrapper.find('#customer_balance').text('0.00');
        }
      });
    }
    
    load_payment_modes() {
      let me = this;
      
      me.page_wrapper.find('.payment-method-container').html(`
        <div class="text-center py-2">
          <i class="fa fa-spinner fa-spin"></i> ${get_text("loading_payments")}
        </div>
      `);
      
      frappe.call({
        method: 'new_invoice.new_invoice.page.receipt_payment.receipt_payment.improved_get_payment_modes',
        callback: function(r) {
          console.log("Payment modes response:", r);
          
          if (r.message && Array.isArray(r.message) && r.message.length > 0) {
            me.payment_modes = r.message;
            
            let html = '<div class="row payment-methods-grid">';
            r.message.forEach(function(mode, index) {
              const isDefault = index === 0;
              const icon = mode.type === 'Cash' || mode.type === 'نقد' ? 'fa-money-bill-alt' : 
                          (mode.type === 'Bank' || mode.type === 'بنك' ? 'fa-university' : 'fa-credit-card');
              
              html += `
                <div class="col-6 col-md-4 mb-3">
                  <div class="payment-method-card ${isDefault ? 'selected' : ''}" 
                       data-payment="${mode.name}" 
                       data-type="${mode.type}"
                       data-requires-reference="${mode.requires_reference}">
                    <i class="fa ${icon} mr-2"></i>
                    <span>${mode.display_name || mode.name}</span>
                  </div>
                </div>
              `;
              
              if (isDefault) {
                me.payment_method = mode.name;
                me.payment_method_type = mode.type;
                me.toggle_reference_fields(mode.requires_reference);
              }
            });
            html += '</div>';
            
            me.page_wrapper.find('.payment-method-container').html(html);
            
            me.page_wrapper.find('.payment-method-card').on('click', function() {
              me.page_wrapper.find('.payment-method-card').removeClass('selected');
              $(this).addClass('selected');
              me.payment_method = $(this).data('payment');
              me.payment_method_type = $(this).data('type');
              
              const requires_reference = $(this).data('requires-reference');
              me.toggle_reference_fields(requires_reference == "true" || requires_reference === true);
            });
          } else {
            me.page_wrapper.find('.payment-method-container').html(`
              <div class="alert alert-warning">
                <p>لا توجد طرق دفع متاحة. اختر أحد الخيارات أدناه:</p>
                <button class="btn btn-sm btn-success mt-2" id="diagnostic_btn">تشخيص المشكلة</button>
                <button class="btn btn-sm btn-secondary mt-2 ml-2" id="select_pos_profile">اختيار صالة بيع</button>
              </div>
            `);
            
            me.page_wrapper.find('#diagnostic_btn').on('click', function() {
              me.run_diagnostics();
            });
            
            me.page_wrapper.find('#select_pos_profile').on('click', function() {
              me.show_pos_profile_selector();
            });
          }
        },
        error: function(xhr, status, error) {
          console.error("Error calling payment modes API:", xhr, status, error);
          me.page_wrapper.find('.payment-method-container').html(`
            <div class="alert alert-danger">
              خطأ في تحميل طرق الدفع. تفاصيل: ${status} - ${error || 'خطأ غير معروف'}
              <br><button class="btn btn-sm btn-outline-primary mt-2" id="retry_payment_modes">إعادة المحاولة</button>
            </div>
          `);
          
          $('#retry_payment_modes').on('click', function() {
            me.load_payment_modes();
          });
        }
      });
    }
    
    run_diagnostics() {
      let me = this;
      
      frappe.call({
        method: 'new_invoice.new_invoice.page.receipt_payment.receipt_payment.troubleshoot_payment_modes',
        callback: function(r) {
          if (r.message) {
            let html = '<div class="alert alert-info">';
            html += '<h5>نتائج التشخيص</h5>';
            html += '<ul>';
            html += `<li>عدد طرق الدفع: ${r.message.mode_of_payment_count || 0}</li>`;
            html += `<li>طرق الدفع المفعلة: ${r.message.enabled_modes_count || 0}</li>`;
            html += `<li>عدد صالات البيع: ${r.message.pos_profile_count || 0}</li>`;
            if (r.message.pos_profile_sample) {
              html += `<li>صالة البيع: ${r.message.pos_profile_sample}</li>`;
              html += `<li>طرق الدفع في صالة البيع: ${r.message.pos_payments_count || 0}</li>`;
            }
            html += `<li>صلاحيات المستخدم: ${r.message.has_permission ? 'موجودة' : 'غير موجودة'}</li>`;
            html += '</ul>';
            
            html += '<div class="mt-3">';
            html += '<button class="btn btn-sm btn-success" id="enable_all_modes_btn">تفعيل جميع طرق الدفع</button>';
            html += '</div>';
            
            html += '</div>';
            
            me.page_wrapper.find('.payment-method-container').html(html);
            
            $('#enable_all_modes_btn').on('click', function() {
              frappe.call({
                method: 'new_invoice.new_invoice.page.receipt_payment.receipt_payment.enable_all_payment_modes',
                callback: function(r) {
                  if (r.message && r.message.success) {
                    frappe.show_alert({message: r.message.message, indicator: 'green'});
                    me.load_payment_modes();
                  } else {
                    frappe.show_alert({message: 'فشل تفعيل طرق الدفع', indicator: 'red'});
                  }
                }
              });
            });
          }
        }
      });
    }
    
    show_pos_profile_selector() {
      let me = this;
      
      frappe.call({
        method: 'frappe.client.get_list',
        args: {
          doctype: 'POS Profile',
          filters: {'disabled': 0},
          fields: ['name']
        },
        callback: function(r) {
          if (r.message && r.message.length > 0) {
            let d = new frappe.ui.Dialog({
              title: 'اختيار صالة البيع',
              fields: [
                {
                  label: 'صالة البيع',
                  fieldname: 'pos_profile',
                  fieldtype: 'Select',
                  options: r.message.map(p => p.name),
                  reqd: 1
                }
              ],
              primary_action_label: 'تأكيد',
              primary_action: function() {
                let pos_profile = d.get_value('pos_profile');
                d.hide();
                
                frappe.call({
                  method: 'new_invoice.new_invoice.page.receipt_payment.receipt_payment.get_payment_modes_from_pos_profile',
                  args: {
                    pos_profile: pos_profile
                  },
                  callback: function(r) {
                    if (r.message && Array.isArray(r.message) && r.message.length > 0) {
                      me.payment_modes = r.message;
                      
                      let html = '<div class="row payment-methods-grid">';
                      r.message.forEach(function(mode, index) {
                        const isDefault = index === 0;
                        const icon = mode.type === 'Cash' || mode.type === 'نقد' ? 'fa-money-bill-alt' : 
                                    (mode.type === 'Bank' || mode.type === 'بنك' ? 'fa-university' : 'fa-credit-card');
                        
                        html += `
                          <div class="col-6 col-md-4 mb-3">
                            <div class="payment-method-card ${isDefault ? 'selected' : ''}" 
                                 data-payment="${mode.name}"
                                 data-type="${mode.type}"
                                 data-requires-reference="${mode.requires_reference}">
                              <i class="fa ${icon} mr-2"></i>
                              <span>${mode.display_name || mode.name}</span>
                            </div>
                          </div>
                        `;
                        
                        if (isDefault) {
                          me.payment_method = mode.name;
                          me.payment_method_type = mode.type;
                          me.toggle_reference_fields(mode.requires_reference);
                        }
                      });
                      html += '</div>';
                      
                      me.page_wrapper.find('.payment-method-container').html(html);
                      
                      me.page_wrapper.find('.payment-method-card').on('click', function() {
                        me.page_wrapper.find('.payment-method-card').removeClass('selected');
                        $(this).addClass('selected');
                        me.payment_method = $(this).data('payment');
                        me.payment_method_type = $(this).data('type');
                        
                        const requires_reference = $(this).data('requires-reference');
                        me.toggle_reference_fields(requires_reference == "true" || requires_reference === true);
                      });
                    } else {
                      frappe.msgprint(`لا توجد طرق دفع مفعلة في صالة البيع المختارة (${pos_profile}).`);
                    }
                  }
                });
              }
            });
            d.show();
          } else {
            frappe.msgprint('لا توجد صالات بيع مفعلة في النظام.');
          }
        }
      });
    }
    
    load_recent_receipts() {
      let me = this;
      
      frappe.call({
        method: 'new_invoice.new_invoice.page.receipt_payment.receipt_payment.get_recent_payment_entries',
        args: {
          limit: 10
        },
        callback: function(r) {
          if (r.message && r.message.length > 0) {
            let rows = '';
            
            r.message.forEach(function(receipt) {
              let status_class = 'secondary';
              
              if (receipt.status === 'Paid' || receipt.status === 'Submitted') {
                status_class = 'success';
              } else if (receipt.status === 'Unpaid') {
                status_class = 'warning';
              } else if (receipt.status === 'Cancelled') {
                status_class = 'danger';
              }
              
              rows += `
                <tr>
                  <td>${receipt.name}</td>
                  <td>${frappe.datetime.str_to_user(receipt.posting_date)}</td>
                  <td>${format_currency(receipt.paid_amount)}</td>
                  <td><span class="badge badge-${status_class}">${receipt.status || 'Draft'}</span></td>
                  <td>
                    <button class="btn btn-sm btn-primary print-receipt" data-receipt="${receipt.name}">
                      <i class="fa fa-print"></i> ${get_text("print")}
                    </button>
                  </td>
                </tr>
              `;
            });
            
            me.page_wrapper.find('#recent_receipts_table tbody').html(rows);
            
            me.page_wrapper.find('.print-receipt').on('click', function() {
              const receipt_id = $(this).data('receipt');
              me.print_receipt(receipt_id);
            });
          } else {
            me.page_wrapper.find('#recent_receipts_table tbody').html(`
              <tr>
                <td colspan="5" class="text-center py-3">
                  ${get_text("no_receipts_found")}
                </td>
              </tr>
            `);
          }
        }
      });
    }
    
    bind_events() {
      let me = this;
      
      this.page_wrapper.find('#create_voucher_btn').on('click', function() {
        me.create_receipt();
      });
      
      this.page_wrapper.find('#print_btn').on('click', function() {
        const frame = document.getElementById('print_frame');
        if (frame.contentWindow) {
          frame.contentWindow.print();
        }
      });
    }
    
    create_receipt() {
      let me = this;
      
      if (!this.party) {
        frappe.msgprint(get_text("select_customer"));
        this.party_field.set_focus();
        return;
      }
      
      if (!this.payment_method) {
        frappe.msgprint(get_text("select_payment"));
        return;
      }
      
      const payment_mode = me.payment_modes.find(m => m.name === me.payment_method);
      if (payment_mode && (payment_mode.requires_reference === true || payment_mode.requires_reference === "true")) {
        if (!me.reference_no) {
          frappe.msgprint("Reference No is mandatory for Bank transaction");
          me.reference_no_field.set_focus();
          return;
        }
        
        if (!me.reference_date) {
          frappe.msgprint("Reference Date is mandatory for Bank transaction");
          me.reference_date_field.set_focus();
          return;
        }
      }
      
      if (!this.amount || this.amount <= 0) {
        frappe.msgprint(get_text("enter_valid_amount"));
        this.amount_field.set_focus();
        return;
      }
      
      frappe.confirm(
        get_text("confirm_create"),
        function() {
          me.page_wrapper.find('#result_message')
            .removeClass('alert-success alert-danger')
            .addClass('alert-info')
            .html('<i class="fa fa-spinner fa-spin"></i> ' + get_text("creating_voucher"))
            .show();
          
          frappe.call({
            method: 'new_invoice.new_invoice.page.receipt_payment.receipt_payment.create_payment_entry',
            args: {
              party_type: 'Customer',
              party: me.party,
              mode_of_payment: me.payment_method,
              amount: me.amount,
              payment_date: frappe.datetime.get_today(),
              reference_no: me.reference_no,
              reference_date: me.reference_date
            },
            callback: function(r) {
              if (r.message) {
                const docStatus = r.message.docstatus || 0;
                const statusText = docStatus === 1 ? 'مسجل' : 'محفوظ';
                
                me.page_wrapper.find('#result_message')
                  .removeClass('alert-info alert-danger')
                  .addClass('alert-success')
                  .html('<i class="fa fa-check-circle"></i> ' + 
                        get_text("receipt_created") + 
                        r.message.name +  
                        ' (' + statusText + ')')
                  .show();
                
                me.print_receipt(r.message.name);
                me.load_recent_receipts();
                me.get_customer_balance(me.party);
                me.reset_form();
              }
            },
            error: function(xhr, status, error) {
              me.page_wrapper.find('#result_message')
                .removeClass('alert-info alert-success')
                .addClass('alert-danger')
                .html('<i class="fa fa-times-circle"></i> ' + 
                      get_text("creation_failed") + 
                      (error || 'Unknown error'))
                .show();
              
              console.error("Payment creation error:", xhr, status, error);
            }
          });
        }
      );
    }
    
   print_receipt(receipt_id) {
  let me = this;
  
  me.page_wrapper.find('#print_dialog').modal('show');
  me.page_wrapper.find('#print_content').html(`
    <div class="text-center py-5">
      <i class="fa fa-spinner fa-spin fa-3x"></i>
    </div>
  `);
  
  frappe.call({
    method: 'frappe.client.get',
    args: {
      doctype: 'Payment Entry',
      name: receipt_id
    },
    callback: function(r) {
      if (r.message) {
        let docData = r.message;
        
        frappe.call({
          method: 'frappe.client.get_value',
          args: {
            doctype: 'Property Setter',
            filters: {
              'doc_type': 'Payment Entry',
              'property': 'default_print_format'
            },
            fieldname: 'value'
          },
          callback: function(r) {
            let print_format = 'Standard';
            
            if (r.message && r.message.value) {
              print_format = r.message.value;
            } 
            
            const print_url = frappe.urllib.get_full_url(
              '/printview?doctype=Payment Entry' +
              '&name=' + receipt_id + 
              '&format=' + print_format + 
              '&no_letterhead=0'
            );
            
            const frame = document.getElementById('print_frame');
            $(frame).attr('src', print_url);
            
            $(frame).on('load', function() {
              try {
                const content = $(this).contents().find('.print-format').html();
                me.page_wrapper.find('#print_content').html(content || 'No print format content found');
              } catch (e) {
                console.error('Error loading print content:', e);
                me.page_wrapper.find('#print_content').html('Error loading print content');
              }
            });
          },
          error: function() {
            const print_url = frappe.urllib.get_full_url(
              '/printview?doctype=Payment Entry' +
              '&name=' + receipt_id + 
              '&format=Standard' + 
              '&no_letterhead=0'
            );
            
            const frame = document.getElementById('print_frame');
            $(frame).attr('src', print_url);
            
            $(frame).on('load', function() {
              try {
                const content = $(this).contents().find('.print-format').html();
                me.page_wrapper.find('#print_content').html(content || 'No print format content found');
              } catch (e) {
                console.error('Error loading print content:', e);
                me.page_wrapper.find('#print_content').html('Error loading print content');
              }
            });
          }
        });
      } else {
        const print_url = frappe.urllib.get_full_url(
          '/printview?doctype=Payment Entry' +
          '&name=' + receipt_id + 
          '&format=Standard' + 
          '&no_letterhead=0'
        );
        
        const frame = document.getElementById('print_frame');
        $(frame).attr('src', print_url);
        
        $(frame).on('load', function() {
          try {
            const content = $(this).contents().find('.print-format').html();
            me.page_wrapper.find('#print_content').html(content || 'No print format content found');
          } catch (e) {
            console.error('Error loading print content:', e);
            me.page_wrapper.find('#print_content').html('Error loading print content');
          }
        });
      }
    },
    error: function() {
      const print_url = frappe.urllib.get_full_url(
        '/printview?doctype=Payment Entry' +
        '&name=' + receipt_id + 
        '&format=Standard' + 
        '&no_letterhead=0'
      );
      
      const frame = document.getElementById('print_frame');
      $(frame).attr('src', print_url);
      
      $(frame).on('load', function() {
        try {
          const content = $(this).contents().find('.print-format').html();
          me.page_wrapper.find('#print_content').html(content || 'No print format content found');
        } catch (e) {
          console.error('Error loading print content:', e);
          me.page_wrapper.find('#print_content').html('Error loading print content');
        }
      });
    }
  });
}
    
    reset_form() {
      this.party = null;
      this.amount = 0;
      this.reference_no = '';
      this.reference_date = '';
      
      this.party_field.set_value('');
      this.amount_field.set_value(0);
      this.reference_no_field.set_value('');
      this.reference_date_field.set_value(frappe.datetime.get_today());
      
      this.party_field.set_focus();
    }
  }
  
  function format_currency(value) {
    return frappe.format(value, {fieldtype: 'Currency'});
  }
  
  window.simple_receipt = new SimpleReceiptController(page);
};