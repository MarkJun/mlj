/**
 * 匹配元素 <input class="makeChooseListAction" id="chooseInput1" data="{{ $json }}"/>
 * 说明：
 *  	1. input class="makeChooseListAction"  id=""    // * 须含有id属性,唯一标识,命名无要求
 * 		2. 属性data放入json字符串
 *      eg: {
 *          	list : [									// 数据列表，
 *              	{id:1, name:'a', age:12, sex:'男'},
 *              	{id:2, name:'b', age:13, sex:'女'},
 *              	....
 *          	],

 *          	selected : [1,2],					// 默认选中id的列表

 *          	fields : ['id','姓名','年龄'], 		// 仅提供列表标题栏显示,与真实字段索引对应

 *          	true_fields : ['id','name','age']  	// 真实字段，与list中字段对应
 *          }
 *      3. 默认显示id搜索框，如真实字段中含有name字段时显示name搜索框
 */
Array.prototype.contains = function(obj) {
    var i = this.length;
    while (i--) {
        if (this[i] === obj) {
            return true;
        }
    }
    return false;
}
Array.prototype.remove = function(val) {
    var index = this.indexOf(val);
    if (index > -1) {
        this.splice(index, 1);
    }
};
String.prototype.stripHTML = function() {
    var reTag = /<(?:.|\s)*?>/g;
    return this.replace(reTag,"");
};
ChooseActionTool = {
    id : null
    ,data : null
    ,showObj : null
    ,inputObj : null
    ,init : function(obj) {
        this.id = obj.attr('id');
        this.inputObj = obj;

        var data = this.parseData();
        if(! data.list) return false; //解码失败

        this.data = data.list;

        this.appendDom(data);

        this.setDefault(data.selected);

        this.bindEvent();
    }
    ,parseData : function(){
        try{
            var data = this.inputObj.attr('data');
            this.inputObj.removeAttr('data');
            var data = JSON.parse(data);
        } catch (error) {
            return false;
        } finally {
            return data;
        }
    }
    ,appendDom : function(data){
        var id = this.id;
        var fieldLen = data.fields.length;
        var htmlStr = '';
        htmlStr += '<div class="col-xs-12 ChooseListBox" style="padding:0;display: none;">';
        htmlStr += '<input type="text" style="position:absolute;right:0;top:-34px;width:20%" class="form-control searchIdChooseList '+id+'" placeholder="根据ID搜索添加"/>';
        htmlStr += '<input type="text" style="position:absolute;right:20%;top:-34px;width:20%;';
        htmlStr += $.inArray("name", data.true_fields)!=-1 ? '':'display:none';
        htmlStr += '" class="form-control searchNameChooseList '+id+'" placeholder="根据Name搜索添加"/>';

        htmlStr += '<div style="max-height: 200px;overflow:auto;"><div class="box-body table-responsive no-padding">';
        htmlStr += '<table class="table table-hover"><thead><tr>';
        htmlStr += '<th>Select</th>';
        for(var i=0; i<fieldLen;i++) {
            htmlStr += '<th>' + data.fields[i] + '</th>';
        }
        htmlStr += '</tr></thead><tbody>';
        for (var i=0; i<data.list.length; i++) {
            htmlStr += '<tr style="display:none" id="' + id + '-' + data.list[i].id + '" tip-id="'+data.list[i].id+'"><td><input type="checkbox" name="ChooseListBtn-'+this.id+'"></td>';
            for (var j=0; j<fieldLen; j++) {
                var value = data.list[i][data.true_fields[j]];
                if(typeof value === 'string')
                {//如为字符串时去除html标签
                    value = $.trim(value.stripHTML());  //去除html标签
                    value = value.replace(/\s+/g, ' '); //去除多余空格
                    value = value.replace(/\"/g, "'");  //转换"为'，便于title显示
                }
                if(data.true_fields[j]=='img') {
                    htmlStr += '<td><img src="' + value + ' height="40"' + '</td>';
                } else {
                    if(value==null){
                        htmlStr += '<td> </td>';
                    }else if(value.length > 20) {
                        value1 = value.substr(0,20) + '...';
                        htmlStr += '<td title="'+value.substr(0,500)+'">'+value1+'</td>';//最多title展示500字符
                    } else {
                        htmlStr += '<td>'+value+'</td>';
                    }
                }
            }
            htmlStr += '</tr>';
        }
        htmlStr += '</tbody> </table> </div> </div> </div>';

        this.inputObj.after(htmlStr);
        this.showObj = this.inputObj.next('.ChooseListBox');
        return this;
    }
    ,setDefault : function(data){
        data = $.unique(data);
        var id = this.id;
        var ids = '';
        var tbody = this.showObj.find('tbody');
        if(data) {
            for ( var i=data.length-1; i>=0; i--) {
                if(! $('#' + id + '-' + data[i]).find('input[type="checkbox"]').length) continue;

                tbody.prepend($('#' + id + '-' + data[i]).find('input[type="checkbox"]').attr("checked",'true').parent().parent().show());
                ids = (ids==''?data[i]:data[i]+',') + ids;
            }
        }

        this.inputObj.val(ids).attr('readonly','readonly');
    }
    ,bindEvent : function(){
        var showObj = this.showObj;
        var objData = this.data;
        var objId = this.id;
        this.inputObj.click(function(){
            showObj.slideToggle();
        })

        showObj.find('tbody tr').css('cursor','pointer').click(function(){
            $(this).find('input').click();
        }).find('input').click(function(e){
            e.stopPropagation();
        })

        $('input[name="ChooseListBtn-' + this.id +'"]').each(function(){
            $(this).change(function(){
                var id = $(this).parent().parent().attr('tip-id');
                var ids = $(this).parents('.ChooseListBox').prev('input').val();
                if(!/^\d+(,\d+)*$/.test(ids)) {
                    ids = '';
                    $(this).parents('.ChooseListBox').prev('input').val('');
                }
                ids = ids.split(',');
                if(ids.length==1&&ids[0]=='') {
                    ids = [];
                }
                if(ids.contains(id)) {
                    ids.remove(id);
                } else {
                    ids.push(id);
                }
                idsStr = ids.join(',');
                $(this).parents('.ChooseListBox').prev('input').val(idsStr);

                var searchIdInputObj = $('.searchIdChooseList.'+objId);
                var id = parseInt(searchIdInputObj.val()) + 0;
                var name = $.trim(searchIdInputObj.next().val());
                if(!id && name=='') {
                    return ;
                }

                showObj.find('tbody tr').hide();
                for(var i=ids.length-1;i>=0;i--) {
                    $('#' + objId + '-' + ids[i]).show();
                }
                searchIdInputObj.val('').next().val('');
            });
        })
        $('.searchIdChooseList.'+objId).keyup(function(){
            var id = parseInt($(this).val());
            if(id != id) id = '';

            var name = $.trim($(this).next().val());
            if(id || id === 0) {
                $(this).val(id);
                for (var i=objData.length-1; i>=0; i--) {
                    if(name!='') {
                        if((objData[i].id+'').indexOf(id)!=-1 && (objData[i].name+'').indexOf(name)!=-1) {
                            if ($('#' + objId + '-' + objData[i].id).find('input[type="checkbox"]').is(':checked')) {
                                $('#' + objId + '-' + objData[i].id).hide();
                            } else {
                                $('#' + objId + '-' + objData[i].id).show();
                            }
                        } else {
                            $('#' + objId + '-' + objData[i].id).hide();
                        }
                    } else {
                        if((objData[i].id+'').indexOf(id)!=-1) {
                            if ($('#' + objId + '-' + objData[i].id).find('input[type="checkbox"]').is(':checked')) {
                                $('#' + objId + '-' + objData[i].id).hide();
                            } else {
                                $('#' + objId + '-' + objData[i].id).show();
                            }
                        } else {
                            $('#' + objId + '-' + objData[i].id).hide();
                        }
                    }
                }
            } else {
                $(this).val('');
                if(name=='') {
                    var ids = $(this).parent().prev('input').val();
                    ids = ids.split(',');
                    showObj.find('tbody tr').hide();
                    for(var i=ids.length-1;i>=0;i--) {
                        $('#' + objId + '-' + ids[i]).show();
                    }
                } else {
                    for (var i = objData.length - 1; i >= 0; i--) {
                        if ((objData[i].name + '').indexOf(name) != -1) {
                            if ($('#' + objId + '-' + objData[i].id).find('input[type="checkbox"]').is(':checked')) {
                                $('#' + objId + '-' + objData[i].id).hide();
                            } else {
                                $('#' + objId + '-' + objData[i].id).show();
                            }
                            $('#' + objId + '-' + objData[i].id).show();
                        } else {
                            $('#' + objId + '-' + objData[i].id).hide();
                        }
                    }
                }
            }
        })
        .next().keyup(function(){
            var id = parseInt($(this).prev().val());
            if(id != id) id = 0;
            var name = $.trim($(this).val());
            $(this).val(name);
            if(name=='' && !id) {
                var ids = $(this).parent().prev('input').val();
                ids = ids.split(',');
                showObj.find('tbody tr').hide();
                for(var i=ids.length-1;i>=0;i--) {
                    $('#' + objId + '-' + ids[i]).show();
                }
                return;
            }
            for (var i=objData.length-1; i>=0; i--) {
                if(id) {
                    if ((objData[i].id+'').indexOf(id)!=-1 && (objData[i].name + '').indexOf(name) != -1) {
                        if ($('#' + objId + '-' + objData[i].id).find('input[type="checkbox"]').is(':checked')) {
                            $('#' + objId + '-' + objData[i].id).hide();
                        } else {
                            $('#' + objId + '-' + objData[i].id).show();
                        }
                    } else {
                            $('#' + objId + '-' + objData[i].id).hide();
                    }
                } else {
                    if ((objData[i].name + '').indexOf(name) != -1) {
                        if ($('#' + objId + '-' + objData[i].id).find('input[type="checkbox"]').is(':checked')) {
                            $('#' + objId + '-' + objData[i].id).hide();
                        } else {
                            $('#' + objId + '-' + objData[i].id).show();
                        }
                    } else {
                            $('#' + objId + '-' + objData[i].id).hide();
                    }
                }
            }
        });
    }
}

var chooseActionObj = $('input.makeChooseListAction');
if(chooseActionObj.length) {
    chooseActionObj.each(function(){
        var res = ChooseActionTool.init($(this));
        console.log(res)
    })
}
