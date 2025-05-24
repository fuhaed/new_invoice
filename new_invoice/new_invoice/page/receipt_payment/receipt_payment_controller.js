frappe.pages['receipt-payment'].on_page_load = function(wrapper) {
  const default_company = frappe.defaults.get_default('company');
 
  var page = frappe.ui.make_app_page({
    parent: wrapper,
    single_column: true
  });
 
  window.voucher_translations = {
    "en": {
      "new_voucher": "New Voucher",
      "recent_vouchers": "Recent Vouchers",
      "voucher_details": "Voucher Details",
      "payment_method": "Payment Method",
      "create": "Create",
      "cancel": "Cancel",
      "recent": "Recent",
      "receipt": "Receipt",
      "payment": "Payment",
      "amount": "Amount",
      "total": "Total",
      "summary": "Summary",
      "loading_payments": "Loading payment methods...",
      "loading_vouchers": "Loading recent vouchers...",
      "no_vouchers_found": "No recent vouchers found",
      "voucher_num": "Voucher #",
      "date": "Date",
      "party": "Party",
      "status": "Status",
      "actions": "Actions",
      "print": "Print",
      "print_preview": "Print Preview",
      "loading_preview": "Loading print preview...",
      "close": "Close",
      "confirm_create": "Are you sure you want to create this voucher?",
      "confirm_cancel": "Are you sure you want to cancel? All unsaved changes will be lost.",
      "select_party": "Please select a party",
      "select_payment": "Please select a payment method",
      "creating_voucher": "Creating voucher...",
      "no_payment_methods": "No payment methods defined.",
      "reference": "Reference",
      "description": "Description",
      "receipt_payment": "Cash Receipt/Payment",
      "receipt_type": "Receipt Type",
      "cash": "Cash",
      "bank": "Bank"
    },
    "ar": {
      "new_voucher": "سند جديد",
      "recent_vouchers": "السندات الحديثة",
      "voucher_details": "تفاصيل السند",
      "payment_method": "طريقة الدفع",
      "create": "إنشاء",
      "cancel": "إلغاء",
      "recent": "الحديثة",
      "receipt": "قبض",
      "payment": "صرف",
      "amount": "المبلغ",
      "total": "الإجمالي",
      "summary": "الملخص",
      "loading_payments": "جاري تحميل طرق الدفع...",
      "loading_vouchers": "جاري تحميل السندات الحديثة...",
      "no_vouchers_found": "لا توجد سندات حديثة",
      "voucher_num": "رقم السند",
      "date": "التاريخ",
      "party": "الطرف",
      "status": "الحالة",
      "actions": "الإجراءات",
      "print": "طباعة",
      "print_preview": "معاينة الطباعة",
      "loading_preview": "جاري تحميل معاينة الطباعة...",
      "close": "إغلاق",
      "confirm_create": "هل أنت متأكد من إنشاء هذا السند؟",
      "confirm_cancel": "هل أنت متأكد من الإلغاء؟ ستفقد جميع التغييرات غير المحفوظة.",
      "select_party": "الرجاء اختيار الطرف",
      "select_payment": "الرجاء اختيار طريقة الدفع",
      "creating_voucher": "جاري إنشاء السند...",
      "no_payment_methods": "لا توجد طرق دفع محددة.",
      "reference": "المرجع",
      "description": "الوصف",
      "receipt_payment": "سند قبض/صرف",
      "receipt_type": "نوع السند",
      "cash": "نقداً",
      "bank": "بنك"
    }
  };
 
  function get_text(key) {
    const user_language = frappe.boot.user.language || "en";
    if (user_language === "ar" && window.voucher_translations.ar[key]) {
      return window.voucher_translations.ar[key];
    }
    return window.voucher_translations.en[key];
  }
 
  $(page.custom_actions).html(`
    <div class="custom-tab-buttons">
      <button class="btn btn-default active" data-view="new-voucher">${get_text("new_voucher")}</button>
      <button class="btn btn-default" data-view="recent-vouchers">${get_text("recent_vouchers")}</button>
    </div>
  `);
 
  $(page.main).html(`
    <div class="views-container">
      <div id="new-voucher-view" class="view-container">
        <div class="voucher-container" style="padding: 5px;">
          <div class="row">
            <div class="col-md-5">
              <div class="card">
                <div class="card-header">
                  ${get_text("voucher_details")}
                </div>
                <div class="card-body">
                  <div class="form-group">
                    <label for="voucher_type">${get_text("receipt_type")}</label>
                    <div class="btn-group btn-group-toggle voucher-type-toggle" data-toggle="buttons" style="width:100%">
                      <label class="btn btn-outline-success active" style="width:50%">
                        <input type="radio" name="voucher_type" id="voucher_receipt" value="receipt" checked> ${get_text("receipt")}
                      </label>
                      <label class="btn btn-outline-danger" style="width:50%">
                        <input type="radio" name="voucher_type" id="voucher_payment" value="payment"> ${get_text("payment")}
                      </label>
                    </div>
                  </div>
                  <div class="form-group">
                    <div id="party_field"></div>
                  </div>
                  <div class="form-group">
                    <div id="date_field"></div>
                  </div>
                  <div class="form-group">
                    <label for="payment_method">${get_text("payment_method")}</label>
                    <div class="btn-group btn-group-toggle payment-method-toggle" data-toggle="buttons" style="width:100%">
                      <label class="btn btn-outline-primary active" style="width:50%">
                        <input type="radio" name="payment_method" id="method_cash" value="cash" checked> ${get_text("cash")}
                      </label>
                      <label class="btn btn-outline-primary" style="width:50%">
                        <input type="radio" name="payment_method" id="method_bank" value="bank"> ${get_text("bank")}
                      </label>
                    </div>
                  </div>
                  <div class="form-group" id="bank_account_container" style="display: none;">
                    <div id="bank_account_field"></div>
                  </div>
                  <div class="form-group">
                    <div id="amount_field"></div>
                  </div>
                  <div class="form-group">
                    <div id="reference_field"></div>
                  </div>
                  <div class="form-group">
                    <div id="description_field"></div>
                  </div>
                  <div class="form-group mt-4">
                    <div class="row">
                      <div class="col-md-6">
                        <button class="btn btn-primary btn-lg btn-block" id="create_voucher_btn" style="font-size: 18px; padding: 12px; height: auto;">
                          <i class="fa fa-save"></i> ${get_text("create")}
                        </button>
                      </div>
                      <div class="col-md-6">
                        <button class="btn btn-danger btn-lg btn-block" id="cancel_voucher_btn" style="font-size: 18px; padding: 12px; height: auto;">
                          <i class="fa fa-times"></i> ${get_text("cancel")}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div class="form-group mt-2">
                    <button class="btn btn-info btn-lg btn-block" id="view_recent_vouchers_btn" style="font-size: 18px; padding: 12px; height: auto;">
                      <i class="fa fa-history"></i> ${get_text("recent")}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="col-md-7">
              <div class="card">
                <div class="card-header">
                  ${get_text("summary")}
                </div>
                <div class="card-body">
                  <div class="voucher-preview">
                    <div class="text-center mb-4">
                      <h3 id="voucher_title" class="receipt-color">${get_text("receipt")}</h3>
                    </div>
                    <div class="row mb-3">
                      <div class="col-6"><strong>${get_text("date")}:</strong></div>
                      <div class="col-6 text-right" id="preview_date">-</div>
                    </div>
                    <div class="row mb-3">
                      <div class="col-6"><strong>${get_text("party")}:</strong></div>
                      <div class="col-6 text-right" id="preview_party">-</div>
                    </div>
                    <div class="row mb-3">
                      <div class="col-6"><strong>${get_text("amount")}:</strong></div>
                      <div class="col-6 text-right" id="preview_amount">0.00</div>
                    </div>
                    <div class="row mb-3">
                      <div class="col-6"><strong>${get_text("payment_method")}:</strong></div>
                      <div class="col-6 text-right" id="preview_method">${get_text("cash")}</div>
                    </div>
                    <div class="row mb-3" id="preview_bank_row" style="display: none;">
                      <div class="col-6"><strong>${get_text("bank")}:</strong></div>
                      <div class="col-6 text-right" id="preview_bank">-</div>
                    </div>
                    <div class="row mb-3">
                      <div class="col-6"><strong>${get_text("reference")}:</strong></div>
                      <div class="col-6 text-right" id="preview_reference">-</div>
                    </div>
                    <div class="row mb-4">
                      <div class="col-12">
                        <strong>${get_text("description")}:</strong>
                        <div id="preview_description" class="border-top pt-2 mt-1">-</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div id="recent-vouchers-view" class="view-container" style="display: none; padding: 15px;">
        <div class="card">
          <div class="card-header">
            <h5>${get_text("recent_vouchers")}</h5>
          </div>
          <div class="card-body">
            <div class="table-responsive">
              <table class="table table-bordered table-hover" id="recent_vouchers_table">
                <thead>
                  <tr>
                    <th>${get_text("voucher_num")}</th>
                    <th>${get_text("date")}</th>
                    <th>${get_text("party")}</th>
                    <th>${get_text("amount")}</th>
                    <th>${get_text("status")}</th>
                    <th>${get_text("actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colspan="6" class="text-center">
                      <i class="fa fa-spinner fa-spin"></i> ${get_text("loading_vouchers")}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      
      <div id="recent_vouchers_dialog" class="modal fade" tabindex="-1" role="dialog">
        <div class="modal-dialog modal-lg" role="document">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">${get_text("recent_vouchers")}</h5>
              <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div class="modal-body">
              <div class="table-responsive">
                <table class="table table-bordered table-hover" id="popup_recent_vouchers_table">
                  <thead>
                    <tr>
                      <th>${get_text("voucher_num")}</th>
                      <th>${get_text("date")}</th>
                      <th>${get_text("party")}</th>
                      <th>${get_text("amount")}</th>
                      <th>${get_text("status")}</th>
                      <th>${get_text("actions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td colspan="6" class="text-center">
                        <i class="fa fa-spinner fa-spin"></i> ${get_text("loading_vouchers")}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary btn-lg" data-dismiss="modal" style="font-size: 16px; padding: 10px;">${get_text("close")}</button>
            </div>
          </div>
        </div>
      </div>
      
      <div id="inline_print_preview" class="modal fade" tabindex="-1" role="dialog">
        <div class="modal-dialog modal-lg" role="document">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">${get_text("print_preview")}</h5>
              <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div class="modal-body">
              <div id="inline_print_content" style="height: 70vh; overflow-y: auto;">
                <div class="text-center py-5">
                  <i class="fa fa-spinner fa-spin fa-3x"></i>
                  <p class="mt-3">${get_text("loading_preview")}</p>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary btn-lg" data-dismiss="modal" style="font-size: 16px; padding: 10px;">${get_text("close")}</button>
              <button type="button" class="btn btn-primary btn-lg" id="direct_print_btn" style="font-size: 16px; padding: 10px;">
                <i class="fa fa-print"></i> ${get_text("print")}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <iframe id="print_iframe" name="print_iframe" style="display:none;"></iframe>
    </div>
  `);
  
  $(`<style>
    .voucher-preview {
      border: 1px solid #e9ecef;
      border-radius: 8px;
      padding: 20px;
      background: #fdfdfd;
    }
    .receipt-color {
      color: #28a745;
    }
    .payment-color {
      color: #dc3545;
    }
    .receipt-border {
      border-color: #28a745 !important;
    }
    .payment-border {
      border-color: #dc3545 !important;
    }
  </style>`).appendTo('head');
 
  window.receipt_payment = new ReceiptPaymentController(page);
};

class ReceiptPaymentController {
  constructor(page) {
    this.page = page;
    this.page_wrapper = $(this.page.wrapper);
    this.voucher_type = 'receipt';
    this.party = null;
    this.payment_method = 'cash';
    this.bank_account = null;
    this.amount = 0;
    this.reference = '';
    this.description = '';
    this.voucher_doc = null;
    
    this.initialize();
  }
  
  get_text(key) {
    const user_language = frappe.boot.user.language || "en";
    if (user_language === "ar" && window.voucher_translations.ar[key]) {
      return window.voucher_translations.ar[key];
    }
    return window.voucher_translations.en[key];
  }
  
  initialize() {
    try {
      this.setup_fields();
      this.bind_events();
      this.setup_tab_switching();
      this.update_voucher_preview();
    } catch (e) {
      console.error("Error initializing receipt/payment page:", e);
      frappe.msgprint({
        title: 'Error',
        indicator: 'red',
        message: 'Error initializing receipt/payment page: ' + e.message
      });
    }
  }
  
  setup_tab_switching() {
    let me = this;
    
    this.page_wrapper.find('.custom-tab-buttons button').on('click', function() {
      me.page_wrapper.find('.custom-tab-buttons button').removeClass('active');
      $(this).addClass('active');
      
      const view = $(this).data('view');
      me.page_wrapper.find('.view-container').hide();
      me.page_wrapper.find('#' + view + '-view').show();
      
      if (view === 'recent-vouchers') {
        me.load_recent_vouchers();
      }
    });
  }
  
  setup_fields() {
    let me = this;
    
    this.party_field = frappe.ui.form.make_control({
      parent: this.page_wrapper.find('#party_field'),
      df: {
        fieldtype: 'Link',
        options: 'Party',
        label: this.get_text("party"),
        fieldname: 'party',
        placeholder: 'Select Party...',
        get_query: function() {
          return {
            filters: {
              disabled: 0
            }
          };
        },
        onchange: function() {
          if (this.value) {
            me.set_party(this.value);
          }
        }
      },
      render_input: true
    });
    
    this.date_field = frappe.ui.form.make_control({
      parent: this.page_wrapper.find('#date_field'),
      df: {
        fieldtype: 'Date',
        label: this.get_text("date"),
        fieldname: 'voucher_date',
        default: frappe.datetime.get_today(),
        onchange: function() {
          me.update_voucher_preview();
        }
      },
      render_input: true
    });
    
    this.amount_field = frappe.ui.form.make_control({
      parent: this.page_wrapper.find('#amount_field'),
      df: {
        fieldtype: 'Currency',
        label: this.get_text("amount"),
        fieldname: 'amount',
        default: 0,
        onchange: function() {
          me.amount = this.value || 0;
          me.update_voucher_preview();
        }
      },
      render_input: true
    });
    
    this.reference_field = frappe.ui.form.make_control({
      parent: this.page_wrapper.find('#reference_field'),
      df: {
        fieldtype: 'Data',
        label: this.get_text("reference"),
        fieldname: 'reference',
        placeholder: 'Reference number...',
        onchange: function() {
          me.reference = this.value || '';
          me.update_voucher_preview();
        }
      },
      render_input: true
    });
    
    this.description_field = frappe.ui.form.make_control({
      parent: this.page_wrapper.find('#description_field'),
      df: {
        fieldtype: 'Small Text',
        label: this.get_text("description"),
        fieldname: 'description',
        placeholder: 'Description...',
        onchange: function() {
          me.description = this.value || '';
          me.update_voucher_preview();
        }
      },
      render_input: true
    });
    
    this.bank_account_field = frappe.ui.form.make_control({
      parent: this.page_wrapper.find('#bank_account_field'),
      df: {
        fieldtype: 'Link',
        options: 'Bank Account',
        label: 'Bank Account',
        fieldname: 'bank_account',
        placeholder: 'Select Bank Account...',
        get_query: function() {
          return {
            filters: {
              is_company_account: 1
            }
          };
        },
        onchange: function() {
          if (this.value) {
            me.bank_account = this.value;
            me.update_voucher_preview();
          }
        }
      },
      render_input: true
    });
    
    this.party_field.refresh();
    this.date_field.refresh();
    this.amount_field.refresh();
    this.reference_field.refresh();
    this.description_field.refresh();
    this.bank_account_field.refresh();
    
    this.date_field.set_value(frappe.datetime.get_today());
  }
  
  bind_events() {
    let me = this;
    
    this.page_wrapper.find('input[name="voucher_type"]').on('change', function() {
      me.voucher_type = $(this).val();
      me.update_voucher_ui();
      me.update_voucher_preview();
    });
    
    this.page_wrapper.find('input[name="payment_method"]').on('change', function() {
      me.payment_method = $(this).val();
      me.toggle_bank_field();
      me.update_voucher_preview();
    });
    
    this.page_wrapper.find('#create_voucher_btn').on('click', function() {
      me.submit_voucher();
    });
    
    this.page_wrapper.find('#cancel_voucher_btn').on('click', function() {
      frappe.confirm(
        me.get_text("confirm_cancel"),
        function() {
          me.reset_form();
        }
      );
    });
    
    this.page_wrapper.find('#view_recent_vouchers_btn').on('click', function() {
      me.load_popup_recent_vouchers();
      me.page_wrapper.find('#recent_vouchers_dialog').modal('show');
    });
    
    this.page_wrapper.find('#direct_print_btn').on('click', function() {
      const iframe = document.getElementById('print_iframe');
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      }
    });
  }
  
  update_voucher_ui() {
    if (this.voucher_type === 'receipt') {
      this.page_wrapper.find('#voucher_title').text(this.get_text("receipt"))
                                           .removeClass('payment-color')
                                           .addClass('receipt-color');
      this.page_wrapper.find('.voucher-preview').removeClass('payment-border')
                                             .addClass('receipt-border');
    } else {
      this.page_wrapper.find('#voucher_title').text(this.get_text("payment"))
                                           .removeClass('receipt-color')
                                           .addClass('payment-color');
      this.page_wrapper.find('.voucher-preview').removeClass('receipt-border')
                                             .addClass('payment-border');
    }
  }
  
  toggle_bank_field() {
    if (this.payment_method === 'bank') {
      this.page_wrapper.find('#bank_account_container').show();
      this.page_wrapper.find('#preview_bank_row').show();
    } else {
      this.page_wrapper.find('#bank_account_container').hide();
      this.page_wrapper.find('#preview_bank_row').hide();
    }
    
    this.page_wrapper.find('#preview_method').text(
      this.payment_method === 'cash' ? this.get_text("cash") : this.get_text("bank")
    );
  }
  
  set_party(party_name) {
    let me = this;
    
    frappe.call({
      method: 'frappe.client.get',
      args: {
        doctype: 'Party',
        name: party_name
      },
      callback: function(r) {
        if (r.message) {
          me.party = r.message;
          me.update_voucher_preview();
        }
      }
    });
  }
  
  update_voucher_preview() {
    const formatted_date = this.date_field.get_value() ? 
                          frappe.datetime.str_to_user(this.date_field.get_value()) : '-';
    this.page_wrapper.find('#preview_date').text(formatted_date);
    
    this.page_wrapper.find('#preview_party').text(
      this.party ? this.party.name : '-'
    );
    
    this.page_wrapper.find('#preview_amount').text(
      this.format_number(this.amount || 0)
    );
    
    this.page_wrapper.find('#preview_method').text(
      this.payment_method === 'cash' ? this.get_text("cash") : this.get_text("bank")
    );
    
    if (this.payment_method === 'bank') {
      this.page_wrapper.find('#preview_bank').text(
        this.bank_account || '-'
      );
    }
    
    this.page_wrapper.find('#preview_reference').text(
      this.reference || '-'
    );
    
    this.page_wrapper.find('#preview_description').text(
      this.description || '-'
    );
  }
  
  format_number(value) {
    return parseFloat(value).toFixed(3);
  }
  
  load_recent_vouchers() {
    let me = this;
    
    const $table = this.page_wrapper.find('#recent_vouchers_table tbody');
    $table.html(`
      <tr>
        <td colspan="6" class="text-center">
          <i class="fa fa-spinner fa-spin"></i> ${me.get_text("loading_vouchers")}
        </td>
      </tr>
    `);
    
    frappe.call({
      method: 'frappe.client.get_list',
      args: {
        doctype: 'Payment Entry',
        fields: ['name', 'posting_date', 'party_name', 'paid_amount', 'status'],
        limit: 10,
        page_length: 10,
        order_by: 'creation desc'
      },
      callback: function(r) {
        if (r.message && r.message.length > 0) {
          let rows = '';
          
          const limited_vouchers = r.message.slice(0, 10);
          
          limited_vouchers.forEach(function(voucher) {
            let status_class = 'secondary';
            
            if (voucher.status === 'Paid' || voucher.status === 'Submitted') {
              status_class = 'success';
            } else if (voucher.status === 'Unpaid') {
              status_class = 'warning';
            } else if (voucher.status === 'Cancelled') {
              status_class = 'danger';
            }
            
            rows += `
              <tr>
                <td>${voucher.name}</td>
                <td>${frappe.datetime.str_to_user(voucher.posting_date)}</td>
                <td>${voucher.party_name}</td>
                <td>${me.format_number(voucher.paid_amount)}</td>
                <td><span class="badge badge-${status_class}">${voucher.status || 'Draft'}</span></td>
                <td>
                  <button class="btn btn-primary btn-block print-popup-voucher" data-voucher="${voucher.name}" style="font-size: 14px; padding: 4px 8px;">
                    <i class="fa fa-print"></i> ${me.get_text("print")}
                  </button>
                </td>
              </tr>
            `;
          });
          
          $table.html(rows);
          
          $table.find('.print-popup-voucher').on('click', function() {
            const voucher_name = $(this).data('voucher');
            me.print_voucher_in_popup(voucher_name);
          });
        } else {
          $table.html(`
            <tr>
              <td colspan="6" class="text-center">${me.get_text("no_vouchers_found")}</td>
            </tr>
          `);
        }
      }
    });
  }
  
  load_popup_recent_vouchers() {
    this.load_recent_vouchers();
  }
  
  print_voucher_in_popup(voucher_name) {
    let me = this;
    let print_format = 'Standard';
    
    let $iframe = this.page_wrapper.find('#print_iframe');
    if (!$iframe.length) {
      $iframe = $('<iframe id="print_iframe" name="print_iframe" style="display:none;"></iframe>');
      this.page_wrapper.append($iframe);
    }
    
    const print_url = frappe.urllib.get_full_url(
      '/printview?doctype=Payment Entry' +
      '&name=' + voucher_name + 
      '&format=' + print_format + 
      '&no_letterhead=0'
    );
    
    $iframe.attr('src', print_url);
    $iframe.on('load', function() {
      const iframe_content = $(this).contents().find('.print-format').html();
      me.page_wrapper.find('#inline_print_content').html(iframe_content);
      me.page_wrapper.find('#inline_print_preview').modal('show');
    });
  }
  
  submit_voucher() {
    let me = this;
    
    if (!this.party) {
      frappe.msgprint(me.get_text("select_party"));
      this.party_field.set_focus();
      return;
    }
    
    if (this.payment_method === 'bank' && !this.bank_account) {
      frappe.msgprint("Please select a bank account");
      this.bank_account_field.set_focus();
      return;
    }
    
    if (!this.amount || this.amount <= 0) {
      frappe.msgprint("Please enter a valid amount");
      this.amount_field.set_focus();
      return;
    }
    
    frappe.confirm(
      me.get_text("confirm_create"),
      function() {
        me._create_voucher();
      }
    );
  }
  
  _create_voucher() {
    let me = this;
    
    frappe.call({
      method: 'frappe.client.insert',
      args: {
        doc: {
          doctype: 'Payment Entry',
          payment_type: me.voucher_type === 'receipt' ? 'Receive' : 'Pay',
          party_type: 'Customer',
          party: me.party.name,
          posting_date: me.date_field.get_value(),
          paid_amount: me.amount,
          received_amount: me.amount,
          reference_no: me.reference,
          reference_date: me.date_field.get_value(),
          remarks: me.description,
          mode_of_payment: me.payment_method === 'cash' ? 'Cash' : 'Bank Draft',
          bank_account: me.payment_method === 'bank' ? me.bank_account : '',
        }
      },
      freeze: true,
      freeze_message: me.get_text("creating_voucher"),
      callback: function(r) {
        if (r.message) {
          me.voucher_doc = r.message;
          me.print_voucher_in_popup(r.message.name);
          
          setTimeout(function() {
            me.reset_form();
          }, 1000);
        }
      }
    });
  }
  
  reset_form() {
    this.party = null;
    this.amount = 0;
    this.reference = '';
    this.description = '';
    this.voucher_doc = null;
    
    this.party_field.set_value('');
    this.date_field.set_value(frappe.datetime.get_today());
    this.amount_field.set_value(0);
    this.reference_field.set_value('');
    this.description_field.set_value('');
    
    this.page_wrapper.find('#method_cash').prop('checked', true);
    this.page_wrapper.find('.payment-method-toggle label').removeClass('active');
    this.page_wrapper.find('.payment-method-toggle label:first-child').addClass('active');
    this.payment_method = 'cash';
    this.toggle_bank_field();
    
    this.page_wrapper.find('#voucher_receipt').prop('checked', true);
    this.page_wrapper.find('.voucher-type-toggle label').removeClass('active');
    this.page_wrapper.find('.voucher-type-toggle label:first-child').addClass('active');
    this.voucher_type = 'receipt';
    this.update_voucher_ui();
    
    this.update_voucher_preview();
    
    this.party_field.set_focus();
  }
}