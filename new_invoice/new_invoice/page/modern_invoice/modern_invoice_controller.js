frappe.ModernInvoiceController = class ModernInvoiceController {
  constructor(page) {
   this.page = page;
   this.page_wrapper = $(this.page.wrapper);
   this.items = [];
   this.customer = null;
   this.pos_profile = null;
   this.payment_method = null;
   this.company = null;
   this.invoice_doc = null;
   this.tax_details = [];
   this.default_customer = null;
   this.payment_type = 'cash';
   
   this.initialize();
  }
  
  get_text(key) {
    const user_language = frappe.boot.user.language || "en";
    if (user_language === "ar" && window.invoice_translations.ar[key]) {
      return window.invoice_translations.ar[key];
    }
    return window.invoice_translations.en[key];
  }
  
  initialize() {
    try {
      this.setup_fields();
      this.bind_events();
      this.setup_tab_switching();
      this.toggle_payment_method_section();
      
      $(`<style>
        .price-cell {
          position: relative;
        }
        .original-price {
          position: absolute;
          top: -15px;
          left: 5px;
          font-size: 11px;
          color: #6c757d;
          text-decoration: none;
        }
        .table td {
          vertical-align: middle;
        }
        .payment-type-toggle .btn {
          font-size: 15px;
          padding: 10px;
        }
      </style>`).appendTo('head');
      
    } catch (e) {
      console.error("Error initializing invoice page:", e);
      frappe.msgprint({
        title: 'Error',
        indicator: 'red',
        message: 'Error initializing invoice page: ' + e.message
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
      
      if (view === 'recent-invoices') {
        me.load_recent_invoices();
      }
    });
  }
  
  setup_fields() {
    let me = this;
    
    this.pos_profile_field = frappe.ui.form.make_control({
      parent: this.page_wrapper.find('#pos_profile_field'),
      df: {
        fieldtype: 'Link',
        options: 'POS Profile',
        label: 'POS Profile',
        fieldname: 'pos_profile',
        placeholder: 'Select POS Profile...',
        get_query: function() {
          return {
            filters: {
              disabled: 0
            }
          };
        },
        onchange: function() {
          if (this.value) {
            me.set_pos_profile(this.value);
          }
        }
      },
      render_input: true
    });
    
    this.customer_field = frappe.ui.form.make_control({
      parent: this.page_wrapper.find('#customer_field'),
      df: {
        fieldtype: 'Link',
        options: 'Customer',
        label: this.get_text("customer"),
        fieldname: 'customer',
        placeholder: 'Select Customer...',
        get_query: function() {
          return {
            filters: {
              disabled: 0
            }
          };
        },
        onchange: function() {
          if (this.value) {
            me.set_customer(this.value);
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
        fieldname: 'invoice_date',
        default: frappe.datetime.get_today()
      },
      render_input: true
    });
    
    this.pos_profile_field.refresh();
    this.customer_field.refresh();
    this.date_field.refresh();
    
    this.date_field.set_value(frappe.datetime.get_today());
    
    frappe.call({
      method: 'frappe.client.get_list',
      args: {
        doctype: 'POS Profile',
        filters: {'disabled': 0},
        fields: ['name'],
        limit: 1
      },
      callback: function(r) {
        if (r.message && r.message.length > 0) {
          me.pos_profile_field.set_value(r.message[0].name);
        }
      }
    });
  }
  
  bind_events() {
    let me = this;
    
    this.page_wrapper.find('#barcode_input').on('keydown', function(e) {
      if (e.which === 13) {
        e.preventDefault();
        const barcode = $(this).val();
        if (barcode) {
          me.scan_barcode(barcode);
          $(this).val('').focus();
        }
      }
    });
    
    this.page_wrapper.find('#scan_button').on('click', function() {
      const barcode = me.page_wrapper.find('#barcode_input').val();
      if (barcode) {
        me.scan_barcode(barcode);
        me.page_wrapper.find('#barcode_input').val('').focus();
      } else {
        me.page_wrapper.find('#barcode_input').focus();
      }
    });
    
    this.page_wrapper.find('#search_button').on('click', function() {
      me.page_wrapper.find('#item_search_dialog').modal('show');
      setTimeout(() => me.page_wrapper.find('#item_search_input').focus(), 100);
    });
    
    this.page_wrapper.find('#item_search_input').on('keydown', function(e) {
      if (e.which === 13) {
        e.preventDefault();
        me.page_wrapper.find('#search_item_button').click();
      }
    });
    
    this.page_wrapper.find('#search_item_button').on('click', function() {
      const search_term = me.page_wrapper.find('#item_search_input').val();
      if (search_term) {
        me.search_items(search_term);
      }
    });
    
    this.page_wrapper.find('#create_invoice_btn').on('click', function() {
      me.submit_invoice();
    });
    
    this.page_wrapper.find('#cancel_invoice_btn').on('click', function() {
      frappe.confirm(
        me.get_text("confirm_cancel"),
        function() {
          me.reset_form();
        }
      );
    });
    
    this.page_wrapper.find('#view_recent_invoices_btn').on('click', function() {
      me.load_popup_recent_invoices();
      me.page_wrapper.find('#recent_invoices_dialog').modal('show');
    });
    
    this.page_wrapper.find('#direct_print_btn').on('click', function() {
      const iframe = document.getElementById('print_iframe');
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      }
    });
    
    this.page_wrapper.find('input[name="payment_type"]').on('change', function() {
      me.payment_type = $(this).val();
      me.toggle_payment_method_section();
    });
  }
  
  toggle_payment_method_section() {
    if (this.payment_type === 'cash') {
      this.page_wrapper.find('.payment-methods-header').show();
      this.page_wrapper.find('.payment-methods-container').show();
    } else {
      this.page_wrapper.find('.payment-methods-header').hide();
      this.page_wrapper.find('.payment-methods-container').hide();
      this.payment_method = null;
    }
  }
  
  set_pos_profile(profile_name) {
    let me = this;
    
    frappe.call({
      method: 'frappe.client.get',
      args: {
        doctype: 'POS Profile',
        name: profile_name
      },
      callback: function(r) {
        if (r.message) {
          me.pos_profile = r.message;
          
          if (r.message.customer) {
            me.default_customer = r.message.customer;
          }
          
          if (r.message.taxes_and_charges) {
            me.load_tax_details(r.message.taxes_and_charges);
          }
          
          if (r.message.customer && !me.customer) {
            me.customer_field.set_value(r.message.customer);
          }
          
          me.load_pos_payment_methods(r.message);
        }
      }
    });
  }
  
  load_pos_payment_methods(pos_profile) {
    let me = this;
    const $container = this.page_wrapper.find('#payment_methods');
    $container.empty();
    
    if (pos_profile.payments && pos_profile.payments.length > 0) {
      const $row = $('<div class="row"></div>');
      
      let payment_methods = [];
      let default_payment_method = null;
      
      if (pos_profile.payments && pos_profile.payments.length > 0) {
        for (let payment of pos_profile.payments) {
          if (payment.default === 1 || payment.default === true) {
            default_payment_method = payment.mode_of_payment;
            break;
          }
        }
        
        if (!default_payment_method) {
          for (let payment of pos_profile.payments) {
            if (payment.type === "Cash" || 
                (payment.mode_of_payment && (
                  payment.mode_of_payment.toLowerCase().includes('cash') ||
                  payment.mode_of_payment.toLowerCase().includes('نقد') ||
                  payment.mode_of_payment.toLowerCase().includes('كاش')
                ))
            ) {
              default_payment_method = payment.mode_of_payment;
              break;
            }
          }
        }
        
        if (!default_payment_method && pos_profile.payments.length > 0) {
          default_payment_method = pos_profile.payments[0].mode_of_payment;
        }
      }
      
      pos_profile.payments.forEach(function(payment) {
        if (payment.mode_of_payment) {
          let isDefault = false;
          
          if ((payment.default === 1 || payment.default === true) || 
              (payment.mode_of_payment === default_payment_method)) {
            isDefault = true;
          }
          
          payment_methods.push({
            name: payment.mode_of_payment,
            type: payment.type || 'Other',
            is_default: isDefault
          });
        }
      });
      
      if (payment_methods.length === 0) {
        $container.html(`<div class="alert alert-warning">${me.get_text("no_payment_methods")}</div>`);
        return;
      }
      
      payment_methods.forEach(function(method) {
        const method_name = method.name || 'Unknown';
        let method_icon = '';
        let is_cash = false;
        let is_default = method.is_default || false;
        
        if (method.type === "Cash" || 
            method.name.toLowerCase().includes('cash') || 
            method.name.toLowerCase().includes('نقد') || 
            method.name.toLowerCase().includes('نقدي') ||
            method.name.toLowerCase().includes('كاش')) {
          method_icon = `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#2E8B57" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="6" width="20" height="12" rx="2"></rect>
            <circle cx="12" cy="12" r="2"></circle>
            <path d="M6 12h.01M18 12h.01"></path>
          </svg>`;
          is_cash = true;
        } else if (method.type === "Card" || 
                 method.name.toLowerCase().includes('card') || 
                 method.name.toLowerCase().includes('credit') || 
                 method.name.toLowerCase().includes('بطاقة') ||
                 method.name.toLowerCase().includes('ائتمان')) {
          method_icon = `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#6f42c1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="5" width="20" height="14" rx="2"></rect>
            <line x1="2" y1="10" x2="22" y2="10"></line>
          </svg>`;
        } else if (method.type === "Bank" || 
                  method.name.toLowerCase().includes('bank') || 
                  method.name.toLowerCase().includes('transfer') || 
                  method.name.toLowerCase().includes('تحويل') ||
                  method.name.toLowerCase().includes('مصرف') ||
                  method.name.toLowerCase().includes('بنك')) {
          method_icon = `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#8a5d3b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="8" width="18" height="12" rx="2"></rect>
            <path d="M7 12h.01M11 12h.01M15 12h.01M19 12h.01"></path>
            <path d="M12 3L2 8h20z"></path>
          </svg>`;
        } else if (method.type === "Cheque" || 
                  method.name.toLowerCase().includes('cheque') || 
                  method.name.toLowerCase().includes('check') || 
                  method.name.toLowerCase().includes('شيك')) {
          method_icon = `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#6c757d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="5" width="18" height="14" rx="2"></rect>
            <line x1="3" y1="10" x2="21" y2="10"></line>
            <path d="M7 15h3M14 15h3"></path>
          </svg>`;
        } else {
          method_icon = `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#6c757d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M12 6v6l4 2"></path>
          </svg>`;
        }
        
        const cashClass = is_cash ? 'cash-payment' : '';
        const defaultClass = is_default ? 'default-payment' : '';
        
        const $method = $(`
          <div class="col-md-6 col-sm-6 mb-2">
            <div class="payment-method ${cashClass} ${defaultClass}" data-method="${method_name}" style="text-align: right; padding: 15px; border: ${is_default ? '3px' : '1px'} solid ${is_default ? '#5e64ff' : '#ddd'}; border-radius: 4px; cursor: pointer; ${is_default ? 'background-color: #f0f4f9;' : ''}">
              <div class="d-flex align-items-center justify-content-between">
                <div style="font-weight: ${is_cash || is_default ? 'bold' : 'normal'}; text-align: left;">
                  ${method_name}
                  ${is_default ? '<small class="text-primary">(Default)</small>' : ''}
                </div>
                <div>${method_icon}</div>
              </div>
            </div>
          </div>
        `);
        
        $method.find('.payment-method').on('click', function() {
          $container.find('.payment-method').css('background-color', '').css('border-color', '#ddd').css('border-width', '1px');
          $(this).css('background-color', '#f0f4f9').css('border-color', '#5e64ff').css('border-width', '3px');
          me.payment_method = method_name;
        });
        
        $row.append($method);
      });
      
      $container.append($row);
      
      $container.append(`
        <style>
          .cash-payment {
            background-color: #f8f9fa;
          }
          .default-payment {
            box-shadow: 0 0 8px rgba(0,0,0,0.15);
            transform: scale(1.02);
          }
        </style>
      `);
      
      if (default_payment_method) {
        const $defaultMethod = $container.find(`.payment-method[data-method="${default_payment_method}"]`);
        if ($defaultMethod.length) {
          $defaultMethod.trigger('click');
          me.payment_method = default_payment_method;
        } else {
          if (payment_methods.length > 0) {
            me.payment_method = payment_methods[0].name;
            $container.find('.payment-method').first().trigger('click');
          }
        }
      } else {
        if (payment_methods.length > 0) {
          me.payment_method = payment_methods[0].name;
          $container.find('.payment-method').first().trigger('click');
        }
      }
    } else {
      $container.html(`<div class="alert alert-warning">${me.get_text("no_payment_methods")}</div>`);
    }
  }
  
  load_tax_details(tax_template) {
    let me = this;
    
    frappe.call({
      method: 'frappe.client.get',
      args: {
        doctype: 'Sales Taxes and Charges Template',
        name: tax_template
      },
      callback: function(r) {
        if (r.message && r.message.taxes) {
          me.tax_details = r.message.taxes;
          me.update_tax_summary();
        }
      }
    });
  }
  
  update_tax_summary() {
    if (!this.tax_details || this.tax_details.length === 0) {
      this.page_wrapper.find('#tax_summary').html(`
        <div class="row mb-2">
          <div class="col-6">${this.get_text("tax")}:</div>
          <div class="col-6 text-right" id="total_tax">0.00</div>
        </div>
      `);
      return;
    }
    
    let combined_rate = 0;
    let tax_names = [];
    
    this.tax_details.forEach((tax) => {
      combined_rate += parseFloat(tax.rate || 0);
      if (tax.description) {
        tax_names.push(tax.description);
      }
    });
    
    let tax_label = tax_names.length > 0 ? tax_names.join(' + ') : this.get_text("tax");
    let tax_html = `
      <div class="row mb-2">
        <div class="col-6">${tax_label} (${combined_rate}%):</div>
        <div class="col-6 text-right" id="total_tax">0.00</div>
      </div>
    `;
    
    this.page_wrapper.find('#tax_summary').html(tax_html);
    this.update_totals();
  }
  
  set_customer(customer_name) {
    let me = this;
    
    frappe.call({
      method: 'frappe.client.get',
      args: {
        doctype: 'Customer',
        name: customer_name
      },
      callback: function(r) {
        if (r.message) {
          me.customer = r.message;
          setTimeout(() => me.page_wrapper.find('#barcode_input').focus(), 100);
        }
      }
    });
  }
  
  scan_barcode(barcode) {
    let me = this;
    
    if (!barcode) {
      frappe.msgprint(me.get_text("select_customer"));
      return;
    }
    
    if (!me.pos_profile) {
      frappe.msgprint(me.get_text("select_profile"));
      me.pos_profile_field.set_focus();
      return;
    }
    
    if (!me.customer) {
      frappe.msgprint(me.get_text("select_customer"));
      me.customer_field.set_focus();
      return;
    }
    
    frappe.call({
      method: 'new_invoice.new_invoice.page.modern_invoice.modern_invoice.scan_barcode',
      args: {
        barcode: barcode,
        pos_profile: me.pos_profile ? me.pos_profile.name : null
      },
      callback: function(r) {
        if (r.message) {
          me.add_item(r.message);
        } else {
          frappe.msgprint(me.get_text("no_product") + barcode);
        }
      }
    });
  }
  
  search_items(search_term) {
    let me = this;
    
    if (!me.pos_profile) {
      frappe.msgprint(me.get_text("select_profile"));
      me.page_wrapper.find('#item_search_dialog').modal('hide');
      me.pos_profile_field.set_focus();
      return;
    }
    
    if (!me.customer) {
      frappe.msgprint(me.get_text("select_customer"));
      me.page_wrapper.find('#item_search_dialog').modal('hide');
      me.customer_field.set_focus();
      return;
    }
    
    const $table = this.page_wrapper.find('#search_results_table tbody');
    $table.html(`
      <tr>
        <td colspan="5" class="text-center">
          <i class="fa fa-spinner fa-spin"></i> ${me.get_text("loading")}
        </td>
      </tr>
    `);
    
    frappe.call({
      method: 'new_invoice.new_invoice.page.modern_invoice.modern_invoice.search_items',
      args: {
        search_term: search_term,
        pos_profile: me.pos_profile ? me.pos_profile.name : null
      },
      callback: function(r) {
        if (r.message && r.message.length > 0) {
          let rows = '';
          
          r.message.forEach(function(item) {
            const stock_class = item.stock_qty > 0 ? 'text-success' : 'text-danger';
            const stock_status = item.stock_qty > 0 ? item.stock_qty : me.get_text("out_of_stock");
            
            rows += `
              <tr>
                <td>${item.item_code}</td>
                <td>${item.item_name}</td>
                <td>${me.format_number(item.rate)}</td>
                <td class="${stock_class}">${stock_status}</td>
                <td>
                  <button class="btn btn-primary add-search-item" 
                         data-item-code="${item.item_code}" 
                         data-item-name="${item.item_name}" 
                         data-rate="${item.rate}" 
                         data-tax-percent="${item.tax_percent || 0}">
                    <i class="fa fa-plus"></i> ${me.get_text("add")}
                  </button>
                </td>
              </tr>
            `;
          });
          
          $table.html(rows);
          
          $table.find('.add-search-item').on('click', function() {
            const btn = $(this);
            const item_data = {
              item_code: btn.data('item-code'),
              item_name: btn.data('item-name'),
              rate: parseFloat(btn.data('rate')),
              tax_percent: parseFloat(btn.data('tax-percent') || 0)
            };
            me.add_search_item(item_data);
          });
        } else {
          $table.html(`
            <tr>
              <td colspan="5" class="text-center">${me.get_text("no_results")}</td>
            </tr>
          `);
        }
      }
    });
  }
  
  add_search_item(item_data) {
    const item_to_add = {
      item_code: item_data.item_code,
      item_name: item_data.item_name,
      rate: item_data.rate,
      tax_percent: item_data.tax_percent || 0
    };
    
    this.add_item(item_to_add);
    this.page_wrapper.find('#item_search_dialog').modal('hide');
  }
  
  add_item(item_data) {
    const existing_item_idx = this.items.findIndex(i => i.item_code === item_data.item_code);
    
    if (existing_item_idx >= 0) {
      this.items[existing_item_idx].qty += 1;
      this.calculate_item_amount(existing_item_idx);
      this.update_item_row(existing_item_idx);
    } else {
      const item = {
        item_code: item_data.item_code,
        item_name: item_data.item_name,
        qty: 1,
        rate: item_data.rate,
        discount_amount: 0,
        tax_percent: item_data.tax_percent || 0,
        amount: item_data.rate,
        original_rate: item_data.rate
      };
      
      this.items.push(item);
      this.calculate_item_amount(this.items.length - 1);
      this.add_item_row(this.items.length - 1);
    }
    
    this.update_totals();
  }
  
  add_item_row(idx) {
    let me = this;
    const item = this.items[idx];
    
    this.page_wrapper.find('#no_items_row').remove();
    
    const row = $(`
      <tr class="item-row" data-idx="${idx}">
        <td>${idx + 1}</td>
        <td>${item.item_name}</td>
        <td>
          <div class="input-group input-group-sm">
            <div class="input-group-prepend">
              <button class="btn btn-default btn-sm minus-qty">
                <i class="fa fa-minus"></i>
              </button>
            </div>
            <input type="number" class="form-control item-qty" value="${item.qty}" min="1" style="width: 60px; text-align: center;">
            <div class="input-group-append">
              <button class="btn btn-default btn-sm plus-qty">
                <i class="fa fa-plus"></i>
              </button>
            </div>
          </div>
        </td>
        <td class="price-cell">
          ${item.original_rate !== item.rate ? 
            `<span class="original-price">${me.format_number(item.original_rate)}</span>` : ''}
          <input type="number" class="form-control form-control-sm item-price" value="${item.rate}" step="0.01" style="width: 80px; text-align: center;">
        </td>
        <td class="item-amount">${this.format_number(item.amount)}</td>
        <td>
          <button class="btn btn-danger btn-sm remove-item">
            <i class="fa fa-trash"></i>
          </button>
        </td>
      </tr>
    `);
    
    row.find('.plus-qty').on('click', function() {
      me.update_item_qty(idx, item.qty + 1);
    });
    
    row.find('.minus-qty').on('click', function() {
      if (item.qty > 1) {
        me.update_item_qty(idx, item.qty - 1);
      }
    });
    
    row.find('.item-qty').on('change', function() {
      const qty = parseInt($(this).val()) || 1;
      me.update_item_qty(idx, qty);
    });
    
    row.find('.item-price').on('change', function() {
      const new_price = parseFloat($(this).val()) || item.rate;
      me.update_item_price(idx, new_price);
    });
    
    row.find('.remove-item').on('click', function() {
      me.remove_item(idx);
    });
    
    this.page_wrapper.find('#items_table tbody').append(row);
  }
  
  update_item_row(idx) {
    const item = this.items[idx];
    const row = this.page_wrapper.find(`tr[data-idx="${idx}"]`);
    
    if (row.length) {
      const $priceCell = row.find('.price-cell');
      const $originalPrice = $priceCell.find('.original-price');
      
      if (item.original_rate !== item.rate) {
        if ($originalPrice.length) {
          $originalPrice.text(this.format_number(item.original_rate));
        } else {
          $priceCell.prepend(`<span class="original-price">${this.format_number(item.original_rate)}</span>`);
        }
      } else {
        $originalPrice.remove();
      }
      
      row.find('.item-qty').val(item.qty);
      row.find('.item-price').val(item.rate);
      row.find('.item-amount').text(this.format_number(item.amount));
    }
  }
  
  update_item_qty(idx, qty) {
    if (idx >= 0 && idx < this.items.length) {
      this.items[idx].qty = qty;
      this.calculate_item_amount(idx);
      this.update_item_row(idx);
      this.update_totals();
    }
  }
  
  update_item_price(idx, new_price) {
    if (idx >= 0 && idx < this.items.length) {
      this.items[idx].rate = new_price;
      this.calculate_item_amount(idx);
      this.update_item_row(idx);
      this.update_totals();
    }
  }
  
  calculate_item_amount(idx) {
    const item = this.items[idx];
    item.amount = item.rate * item.qty;
  }
  
  remove_item(idx) {
    let me = this;
    
    this.items.splice(idx, 1);
    
    const $tbody = this.page_wrapper.find('#items_table tbody');
    $tbody.empty();
    
    if (this.items.length === 0) {
      $tbody.html(`
        <tr id="no_items_row">
          <td colspan="6" class="text-center">${me.get_text("no_items")}</td>
        </tr>
      `);
    } else {
      this.items.forEach(function(item, newIdx) {
        const row = $(`
          <tr class="item-row" data-idx="${newIdx}">
            <td>${newIdx + 1}</td>
            <td>${item.item_name}</td>
            <td>
              <div class="input-group input-group-sm">
                <div class="input-group-prepend">
                  <button class="btn btn-default btn-sm minus-qty">
                    <i class="fa fa-minus"></i>
                  </button>
                </div>
                <input type="number" class="form-control item-qty" value="${item.qty}" min="1" style="width: 60px; text-align: center;">
                <div class="input-group-append">
                  <button class="btn btn-default btn-sm plus-qty">
                    <i class="fa fa-plus"></i>
                  </button>
                </div>
              </div>
            </td>
            <td class="price-cell">
              ${item.original_rate !== item.rate ? 
                `<span class="original-price">${me.format_number(item.original_rate)}</span>` : ''}
              <input type="number" class="form-control form-control-sm item-price" value="${item.rate}" step="0.01" style="width: 80px; text-align: center;">
            </td>
            <td class="item-amount">${me.format_number(item.amount)}</td>
            <td>
              <button class="btn btn-danger btn-sm remove-item">
                <i class="fa fa-trash"></i>
              </button>
            </td>
          </tr>
        `);
        
        row.find('.plus-qty').on('click', function() {
          me.update_item_qty(newIdx, item.qty + 1);
        });
        
        row.find('.minus-qty').on('click', function() {
          if (item.qty > 1) {
            me.update_item_qty(newIdx, item.qty - 1);
          }
        });
        
        row.find('.item-qty').on('change', function() {
          const qty = parseInt($(this).val()) || 1;
          me.update_item_qty(newIdx, qty);
        });
        
        row.find('.item-price').on('change', function() {
          const new_price = parseFloat($(this).val()) || item.rate;
          me.update_item_price(newIdx, new_price);
        });
        
        row.find('.remove-item').on('click', function() {
          me.remove_item(newIdx);
        });
        
        $tbody.append(row);
      });
    }
    
    this.update_totals();
  }

  update_totals() {
    let subtotal = 0;
    let total_tax = 0;
    let tax_inclusive = false;
    
    if (this.tax_details && this.tax_details.length > 0) {
      tax_inclusive = this.tax_details.some(tax => tax.included_in_print_rate);
    }
    
    this.items.forEach((item) => {
      subtotal += (item.rate * item.qty);
      
      const taxable_amount = item.amount;
      
      if (this.tax_details && this.tax_details.length > 0) {
        let current_tax_amount = 0;
        
        this.tax_details.forEach((tax) => {
          let tax_amount = 0;
          
          if (tax.included_in_print_rate) {
            const tax_rate = parseFloat(tax.rate || 0);
            tax_amount = (taxable_amount * tax_rate) / (100 + tax_rate);
          } else {
            tax_amount = (taxable_amount * parseFloat(tax.rate || 0)) / 100;
          }
          
          current_tax_amount += tax_amount;
        });
        
        total_tax += current_tax_amount;
      } else {
        const tax_amount = (taxable_amount * item.tax_percent) / 100;
        total_tax += tax_amount;
      }
    });
    
    let grand_total;
    if (tax_inclusive) {
      this.page_wrapper.find('#subtotal').text(this.format_number(subtotal - total_tax));
      grand_total = subtotal;
    } else {
      this.page_wrapper.find('#subtotal').text(this.format_number(subtotal));
      grand_total = subtotal + total_tax;
    }
    
    this.page_wrapper.find('#total_tax').text(this.format_number(total_tax));
    this.page_wrapper.find('#grand_total').text(this.format_number(grand_total));
  }

  format_number(value) {
    return parseFloat(value).toFixed(3);
  }

  load_recent_invoices() {
    let me = this;
    
    const $table = this.page_wrapper.find('#recent_invoices_table tbody');
    $table.html(`
      <tr>
        <td colspan="6" class="text-center">
          <i class="fa fa-spinner fa-spin"></i> ${me.get_text("loading_invoices")}
        </td>
      </tr>
    `);
    
    frappe.call({
      method: 'frappe.client.get_list',
      args: {
        doctype: 'Sales Invoice',
        fields: ['name', 'posting_date', 'customer_name', 'grand_total', 'status'],
        limit: 10,
        page_length: 10,
        order_by: 'creation desc'
      },
      callback: function(r) {
        if (r.message && r.message.length > 0) {
          let rows = '';
          
          const limited_invoices = r.message.slice(0, 10);
          
          limited_invoices.forEach(function(inv) {
            let status_class = 'secondary';
            
            if (inv.status === 'Paid') {
              status_class = 'success';
            } else if (inv.status === 'Unpaid') {
              status_class = 'warning';
            } else if (inv.status === 'Overdue') {
              status_class = 'danger';
            } else if (inv.status === 'Return') {
              status_class = 'info';
            }
            
            rows += `
              <tr>
                <td>${inv.name}</td>
                <td>${frappe.datetime.str_to_user(inv.posting_date)}</td>
                <td>${inv.customer_name}</td>
                <td>${me.format_number(inv.grand_total)}</td>
                <td><span class="badge badge-${status_class}">${inv.status}</span></td>
                <td>
                  <button class="btn btn-primary btn-lg btn-block print-invoice" data-invoice="${inv.name}" style="font-size: 14px; padding: 8px; height: auto;">
                    <i class="fa fa-print"></i> ${me.get_text("print")}
                  </button>
                </td>
              </tr>
            `;
          });
          
          $table.html(rows);
          
          $table.find('.print-invoice').on('click', function() {
            const invoice_name = $(this).data('invoice');
            me.print_invoice_in_popup(invoice_name);
          });
        } else {
          $table.html(`
            <tr>
              <td colspan="6" class="text-center">${me.get_text("no_invoices_found")}</td>
            </tr>
          `);
        }
      }
    });
  }

  load_popup_recent_invoices() {
    let me = this;
    
    const $table = this.page_wrapper.find('#popup_recent_invoices_table tbody');
    $table.html(`
      <tr>
        <td colspan="6" class="text-center">
          <i class="fa fa-spinner fa-spin"></i> ${me.get_text("loading_invoices")}
        </td>
      </tr>
    `);
    
    frappe.call({
      method: 'frappe.client.get_list',
      args: {
        doctype: 'Sales Invoice',
        fields: ['name', 'posting_date', 'customer_name', 'grand_total', 'status'],
        limit: 10,
        page_length: 10,
        order_by: 'creation desc'
      },
      callback: function(r) {
        if (r.message && r.message.length > 0) {
          let rows = '';
          
          const limited_invoices = r.message.slice(0, 10);
          
          limited_invoices.forEach(function(inv) {
            let status_class = 'secondary';
            
            if (inv.status === 'Paid') {
              status_class = 'success';
            } else if (inv.status === 'Unpaid') {
              status_class = 'warning';
            } else if (inv.status === 'Overdue') {
              status_class = 'danger';
            } else if (inv.status === 'Return') {
              status_class = 'info';
            }
            
            rows += `
              <tr>
                <td>${inv.name}</td>
                <td>${frappe.datetime.str_to_user(inv.posting_date)}</td>
                <td>${inv.customer_name}</td>
                <td>${me.format_number(inv.grand_total)}</td>
                <td><span class="badge badge-${status_class}">${inv.status}</span></td>
                <td>
                  <button class="btn btn-primary btn-lg btn-block print-popup-invoice" data-invoice="${inv.name}" style="font-size: 14px; padding: 8px; height: auto;">
                    <i class="fa fa-print"></i> ${me.get_text("print")}
                  </button>
                </td>
              </tr>
            `;
          });
          
          $table.html(rows);
          
          $table.find('.print-popup-invoice').on('click', function() {
            const invoice_name = $(this).data('invoice');
            me.print_invoice_in_popup(invoice_name);
          });
        } else {
          $table.html(`
            <tr>
              <td colspan="6" class="text-center">${me.get_text("no_invoices_found")}</td>
            </tr>
          `);
        }
      }
    });
  }

  print_invoice_in_popup(invoice_name) {
    let me = this;
    let print_format = 'Standard';
    
    if (this.pos_profile && this.pos_profile.print_format) {
      print_format = this.pos_profile.print_format;
    }
    
    let $iframe = this.page_wrapper.find('#print_iframe');
    if (!$iframe.length) {
      $iframe = $('<iframe id="print_iframe" name="print_iframe" style="display:none;"></iframe>');
      this.page_wrapper.append($iframe);
    }
    
    const print_url = frappe.urllib.get_full_url(
      '/printview?doctype=Sales Invoice' +
      '&name=' + invoice_name + 
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

  direct_print(invoice_name, print_format) {
    let me = this;
    
    let $iframe = this.page_wrapper.find('#print_iframe');
    if (!$iframe.length) {
      $iframe = $('<iframe id="print_iframe" name="print_iframe" style="display:none;"></iframe>');
      this.page_wrapper.append($iframe);
    }
    
    const print_url = frappe.urllib.get_full_url(
      '/printview?doctype=Sales Invoice' +
      '&name=' + invoice_name + 
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

  submit_invoice() {
    let me = this;
    
    if (!this.customer) {
      frappe.msgprint(me.get_text("select_customer"));
      this.customer_field.set_focus();
      return;
    }
    
    if (!this.pos_profile) {
      frappe.msgprint(me.get_text("select_profile"));
      this.pos_profile_field.set_focus();
      return;
    }
    
    if (this.payment_type === 'cash' && !this.payment_method) {
      frappe.msgprint(me.get_text("select_payment"));
      return;
    }
    
    if (this.items.length === 0) {
      frappe.msgprint(me.get_text("add_item"));
      this.page_wrapper.find('#barcode_input').focus();
      return;
    }
    
    frappe.confirm(
      me.get_text("confirm_create"),
      function() {
        me._create_invoice();
      }
    );
  }

  _create_invoice() {
    let me = this;
    
    const invoice_date = this.date_field.get_value() || frappe.datetime.get_today();
    
    let items_to_send = [];
    this.items.forEach(item => {
      items_to_send.push({
        item_code: item.item_code,
        item_name: item.item_name,
        qty: item.qty,
        rate: item.rate,
        base_rate: item.rate,
        price_list_rate: item.original_rate || item.rate,
        amount: item.amount
      });
    });
    
    frappe.call({
      method: 'new_invoice.new_invoice.page.modern_invoice.modern_invoice.create_sales_invoice',
      args: {
        customer: this.customer.name,
        pos_profile: this.pos_profile.name,
        items: items_to_send,
        payment_method: this.payment_type === 'cash' ? this.payment_method : null,
        is_pos: this.payment_type === 'cash' ? 1 : 0,
        invoice_date: invoice_date
      },
      freeze: true,
      freeze_message: this.get_text("creating_invoice"),
      callback: function(r) {
        if (r.message) {
          me.invoice_doc = r.message;
          me.direct_print(r.message.name, me.pos_profile.print_format || 'Standard');
          
          setTimeout(function() {
            me.reset_form();
          }, 1000);
        }
      }
    });
  }

  reset_form() {
    const default_customer = this.default_customer;
    const current_pos_profile = this.pos_profile ? this.pos_profile.name : null;
    
    this.items = [];
    this.invoice_doc = null;
    
    if (default_customer) {
      this.customer_field.set_value(default_customer);
      this.set_customer(default_customer);
    } else {
      this.customer_field.set_value('');
      this.customer = null;
    }
    
    this.date_field.set_value(frappe.datetime.get_today());
    
    this.page_wrapper.find('#payment_cash').prop('checked', true);
    this.page_wrapper.find('.payment-type-toggle label').removeClass('active');
    this.page_wrapper.find('.payment-type-toggle label:first-child').addClass('active');
    this.payment_type = 'cash';
    this.toggle_payment_method_section();
    
    this.page_wrapper.find('#items_table tbody').html(`
      <tr id="no_items_row">
        <td colspan="6" class="text-center">${this.get_text("no_items")}</td>
      </tr>
    `);
    
    this.update_totals();
    
    if (default_customer) {
      setTimeout(() => this.page_wrapper.find('#barcode_input').focus(), 100);
    } else {
      this.customer_field.set_focus();
    }
  }
};