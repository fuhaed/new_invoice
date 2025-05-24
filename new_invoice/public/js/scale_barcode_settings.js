// ملف: scale_barcode_settings.js
// قم بإنشاء هذا الملف في المسار: new_invoice/new_invoice/public/js/scale_barcode_settings.js

frappe.ui.form.on('POS Profile', {
    refresh: function(frm) {
        // إضافة قسم إعدادات باركود الميزان
        if (!frm.doc.scale_barcode_section) {
            frm.add_custom_section('scale_barcode_settings_section', function(section) {
                section.append(`
                    <div class="scale-barcode-settings">
                        <h4>${__('إعدادات باركود الميزان')}</h4>
                        <div class="row">
                            <div class="col-md-12">
                                <div class="form-group">
                                    <div class="checkbox">
                                        <label>
                                            <input type="checkbox" class="enable-scale-barcode" 
                                                ${frm.doc.enable_scale_barcode ? 'checked' : ''}>
                                            ${__('تفعيل دعم باركود الميزان')}
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="scale-barcode-config ${frm.doc.enable_scale_barcode ? '' : 'd-none'}">
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="form-group">
                                        <label>${__('بادئة باركود الميزان')}</label>
                                        <input type="text" class="form-control scale-barcode-prefix" 
                                            value="${frm.doc.scale_barcode_prefix || '99'}" 
                                            placeholder="99">
                                        <small class="text-muted">${__('عادةً تكون 99 أو 20 أو 21 أو 22')}</small>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="form-group">
                                        <label>${__('طول باركود الميزان')}</label>
                                        <input type="number" class="form-control scale-barcode-length" 
                                            value="${frm.doc.scale_barcode_length || 13}" min="8" max="15">
                                        <small class="text-muted">${__('عادةً يكون 13 أو 12 رقماً')}</small>
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="form-group">
                                        <label>${__('موقع الوزن في الباركود')}</label>
                                        <select class="form-control scale-barcode-weight-position">
                                            <option value="end" ${frm.doc.scale_barcode_weight_position === 'end' ? 'selected' : ''}>${__('في نهاية الباركود')}</option>
                                            <option value="middle" ${frm.doc.scale_barcode_weight_position === 'middle' ? 'selected' : ''}>${__('في وسط الباركود')}</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="form-group">
                                        <label>${__('أطوال أرقام الوزن')}</label>
                                        <input type="number" class="form-control scale-barcode-weight-length" 
                                            value="${frm.doc.scale_barcode_weight_length || 5}" min="3" max="7">
                                        <small class="text-muted">${__('عادةً 5 أرقام (3 للكيلو و2 للجرام)')}</small>
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="form-group">
                                        <label>${__('مقياس تحويل الوزن')}</label>
                                        <select class="form-control scale-barcode-weight-scale">
                                            <option value="1000" ${frm.doc.scale_barcode_weight_scale === '1000' ? 'selected' : ''}>${__('جرام إلى كيلوجرام (÷ 1000)')}</option>
                                            <option value="100" ${frm.doc.scale_barcode_weight_scale === '100' ? 'selected' : ''}>${__('جرام إلى كيلوجرام (÷ 100)')}</option>
                                            <option value="1" ${frm.doc.scale_barcode_weight_scale === '1' ? 'selected' : ''}>${__('الوزن مسجل مباشرةً')}</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="form-group">
                                        <label>${__('نوع الميزان')}</label>
                                        <select class="form-control scale-barcode-type">
                                            <option value="standard" ${frm.doc.scale_barcode_type === 'standard' ? 'selected' : ''}>${__('قياسي')}</option>
                                            <option value="dibal" ${frm.doc.scale_barcode_type === 'dibal' ? 'selected' : ''}>${__('Dibal')}</option>
                                            <option value="cas" ${frm.doc.scale_barcode_type === 'cas' ? 'selected' : ''}>${__('CAS')}</option>
                                            <option value="digi" ${frm.doc.scale_barcode_type === 'digi' ? 'selected' : ''}>${__('DIGI')}</option>
                                            <option value="custom" ${frm.doc.scale_barcode_type === 'custom' ? 'selected' : ''}>${__('مخصص')}</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-12">
                                    <div class="form-group">
                                        <button class="btn btn-primary btn-sm test-scale-barcode">
                                            <i class="fa fa-barcode"></i> ${__('اختبار باركود الميزان')}
                                        </button>
                                        <button class="btn btn-default btn-sm save-scale-barcode-settings">
                                            <i class="fa fa-save"></i> ${__('حفظ الإعدادات')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `);

                // تفعيل الأحداث
                section.find('.enable-scale-barcode').on('change', function() {
                    if ($(this).is(':checked')) {
                        section.find('.scale-barcode-config').removeClass('d-none');
                        frm.doc.enable_scale_barcode = 1;
                    } else {
                        section.find('.scale-barcode-config').addClass('d-none');
                        frm.doc.enable_scale_barcode = 0;
                    }
                });

                section.find('.save-scale-barcode-settings').on('click', function() {
                    frm.doc.scale_barcode_prefix = section.find('.scale-barcode-prefix').val();
                    frm.doc.scale_barcode_length = parseInt(section.find('.scale-barcode-length').val());
                    frm.doc.scale_barcode_weight_position = section.find('.scale-barcode-weight-position').val();
                    frm.doc.scale_barcode_weight_length = parseInt(section.find('.scale-barcode-weight-length').val());
                    frm.doc.scale_barcode_weight_scale = section.find('.scale-barcode-weight-scale').val();
                    frm.doc.scale_barcode_type = section.find('.scale-barcode-type').val();
                    
                    frm.save();
                    frappe.show_alert({
                        message: __('تم حفظ إعدادات باركود الميزان'),
                        indicator: 'green'
                    });
                });

                section.find('.test-scale-barcode').on('click', function() {
                    const d = new frappe.ui.Dialog({
                        title: __('اختبار باركود الميزان'),
                        fields: [
                            {
                                label: __('أدخل باركود الميزان للاختبار'),
                                fieldname: 'test_barcode',
                                fieldtype: 'Data',
                                reqd: 1
                            }
                        ],
                        primary_action_label: __('اختبار'),
                        primary_action: function() {
                            const values = d.get_values();
                            
                            if (!values.test_barcode) return;
                            
                            const prefix = section.find('.scale-barcode-prefix').val();
                            const length = parseInt(section.find('.scale-barcode-length').val());
                            const weight_position = section.find('.scale-barcode-weight-position').val();
                            const weight_length = parseInt(section.find('.scale-barcode-weight-length').val());
                            const weight_scale = parseInt(section.find('.scale-barcode-weight-scale').val());
                            const scale_type = section.find('.scale-barcode-type').val();
                            
                            // محاكاة تحليل الباركود باستخدام الإعدادات الحالية
                            let barcode = values.test_barcode.trim();
                            
                            if (barcode.startsWith(prefix)) {
                                let weight = 0;
                                let product_code = '';
                                
                                if (weight_position === 'end') {
                                    weight = parseFloat(barcode.slice(-weight_length)) / weight_scale;
                                    product_code = barcode.slice(0, -weight_length);
                                } else if (weight_position === 'middle') {
                                    // تطبيق منطق خاص حسب نوع الميزان
                                    if (scale_type === 'dibal') {
                                        weight = parseFloat(barcode.slice(7, 7 + weight_length)) / weight_scale;
                                        product_code = prefix + barcode.slice(2, 7);
                                    } else {
                                        weight = parseFloat(barcode.slice(prefix.length, prefix.length + weight_length)) / weight_scale;
                                        product_code = prefix + barcode.slice(prefix.length + weight_length);
                                    }
                                }
                                
                                d.hide();
                                frappe.msgprint({
                                    title: __('نتيجة تحليل باركود الميزان'),
                                    message: `
                                        <div style="font-size: 16px;">
                                            <div><strong>${__('الباركود الأصلي')}:</strong> ${barcode}</div>
                                            <div><strong>${__('رمز المنتج المستخرج')}:</strong> ${product_code}</div>
                                            <div><strong>${__('الوزن المستخرج')}:</strong> ${weight.toFixed(3)} كجم</div>
                                        </div>
                                    `,
                                    indicator: 'blue'
                                });
                            } else {
                                frappe.msgprint({
                                    title: __('ليس باركود ميزان'),
                                    message: __('الباركود المدخل لا يبدأ ببادئة باركود الميزان المحددة ({0})', [prefix]),
                                    indicator: 'orange'
                                });
                            }
                        }
                    });
                    
                    d.show();
                });
            });
        }
    },
    
    after_save: function(frm) {
        // التحقق من تسجيل الإعدادات في قاعدة البيانات
        if (frm.doc.enable_scale_barcode && !frm.doc.scale_barcode_prefix) {
            frappe.show_alert({
                message: __('لم يتم حفظ إعدادات باركود الميزان بشكل كامل. يرجى حفظ الإعدادات مرة أخرى.'),
                indicator: 'orange'
            });
        }
    }
});