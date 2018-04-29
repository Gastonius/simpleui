/*
 * All scripts in one file without compression
 */

/*
 * Ugly but simple method to store our data.
 */

function dataBase() {
  this.data = [];

  this.LSsave = function() {
    localStorage.setItem('appData', JSON.stringify(this.data));
  };

  this.LSrestore = function() {
    var retrievedObject = localStorage.getItem('appData');
    this.data = JSON.parse(retrievedObject) || [];
  }
}

// Retrieves all the items from the database
dataBase.prototype.retrieve = function(callback) {
  this.LSrestore();
  if (callback) callback();
}

// Stores an item into the database
dataBase.prototype.insert = function(data, callback) {
  if (!data.index) data.index = this.data.length;
  this.data.push(data);
  this.LSsave();
  if (callback) callback.call(this);
}

// Update a record in the dabatase
dataBase.prototype.update = function(data, callback) {
  console.log(data);
  this.data.splice(data.index,1,data);
  this.LSsave();
  if (callback) callback.call(this);
}

// Removes an item from the database
dataBase.prototype.remove = function(index, callback) {
  this.data.splice(index,1);
  this.LSsave();
  if (callback) callback.call(this);
}

// Empties the database (useful for development)
dataBase.prototype.empty = function(callback) {
  if (callback) callback.call(this);
}

// Special function to answer to drag and drop accordingly
dataBase.prototype.swapItem = function(from,to) {
  this.data[from] = this.data.splice(to, 1, this.data[from])[0];
  this.data[to].index = to;
  this.data[from].index = from;
  this.LSsave();
}

// Helper function to empty the database
dataBase.prototype.empty = function() {
  this.data = [];
  this.LSsave();
}

/*
 * Interface dealing functions
 */

function interface() {
  this.init = function() {
    $('.fixed-action-btn').floatingActionButton();

    $('#add_new_record')
      .off('click.ui')
      .on('click.ui', this.addRecord)
      .off('mouseover.ui')
      .on('mouseover.ui', function() { this.showTip('Add a new record') }.bind(this))
      .off('mouseout.ui').on('mouseout.ui', this.hideTip);

    $('#empty_database_btn')
      .off('click.ui')
      .on('click.ui', function() {
        db.empty();
        ui.showData();
      })
      .off('mouseover.ui')
      .on('mouseover.ui', function() { this.showTip('Empty the entire database!') }.bind(this))
      .off('mouseout.ui').on('mouseout.ui', this.hideTip);

    $('#change_visualization_format')
      .off('click.ui')
      .on('click.ui', this.switchUI)
      .off('mouseover.ui')
      .on('mouseover.ui', function() { this.showTip('Change visualization format') }.bind(this))
      .off('mouseout.ui')
      .on('mouseout.ui', this.hideTip);
  }

  this.button = function( parms ) {
    var button = $('<a class="waves-effect waves-light">').html(parms.content);
    if (parms.color) button.addClass(parms.color);
    if (parms.onClick) button.on('click.ui', parms.onClick);
    if (parms.floating) button.addClass('btn-floating');
    button.addClass(parms.size ? 'btn-' + parms.size : 'btn-small');
    return button;
  } 

  this.showData = function() {
    if (db.data.length === 0) {
      var modal = $('#modal_empty_database').modal();
      modal.modal('open');
      $('#btn_autofilldb').off('click.action').on('click.action', function() {
        var jsonData = utils.loadDataFromJSON( function( jsonData ) {
          $.each( jsonData, function() {
            db.insert(this);
          });
          ui.showData();
        });
      })
    } else {
      ui.fillData();
    }
  }

  this.fillData = function() {
    $('.ui_item').remove();

    $.each( db.data, function(item, value) {
      var container = $('<div>')
        .addClass('ui_item')
        .appendTo('.main_container')
        .prop('id','data_' + item)
        .data('dbindex', item);

      var img = $('<img>').addClass('ui_item_img').appendTo(container).prop('src',value.img);
      var text = $('<div>').addClass('ui_item_text').appendTo(container).html(value.name);
      var actionButtons = $('<div>').addClass('ui_item_buttons').appendTo(container);

      var removeButton = ui.button({
        content: '<i class="material-icons left">remove</i>Remove',
        color: 'red',
        onClick: function() { db.remove(item, function() { ui.fillData() }) }
      });

      var editButton = ui.button({
        content: '<i class="material-icons left">edit</i>Edit',
        onClick: function() { ui.editRecord(item, function() { ui.fillData() }) }
      });

      actionButtons.append(removeButton,editButton);

      this.makeItDraggable(container);
    }.bind(this));

    $('.counter').html('Displaying ' + db.data.length + ' items.');
  }

  this.makeItDraggable = function(container) {
    container.prop('draggable',true).on('dragstart.ui', function(ev) {
      var dragElement = $(ev.originalEvent.target).closest('.ui_item');
      ev.originalEvent.dataTransfer.setData("text", dragElement.prop('id'));

      $(this).addClass('dragging');
    }).on('dragend.ui', function(ev) {
      $(this).removeClass('dragging').removeClass('dragover');
    }).on('dragover.ui', function(ev) {
      ev.originalEvent.preventDefault();

      $(this).addClass('dragover');
    }).on('dragleave.ui', function(ev) {
      ev.originalEvent.preventDefault();

      $(this).removeClass('dragover');
    }).on('drop', function(ev) {
      ev.preventDefault();
      var data = ev.originalEvent.dataTransfer.getData("text");
      db.swapItem($(this).data('dbindex'),$('#' + data).data('dbindex'));
      ui.fillData();
    });
  }

  this.showTip = function(text) {
    $('.tooltip').html(text).addClass('shown');
  }

  this.hideTip = function(text) {
    $('.tooltip').html('').removeClass('shown');
  }

  this.switchUI = function() {
    if ( $('.main_container').hasClass('cards') ) {
      $('.main_container').removeClass('cards').addClass('rows');
    } else {
      $('.main_container').removeClass('rows').addClass('cards');
    }
  }

  this.editRecord = function(index, callback) {
    var toEdit = db.data[index];
    toEdit.index = index;
    this.addRecord(toEdit);
  }

  this.showError = function(error) {
    console.log(error);
    M.toast({html: error});
  }

  this.addRecord = function(data) {
    if (!data) data = {};
    var container = $('<div>')
      .addClass('ui_item')
      .addClass('create_record')
      .prependTo('.main_container');

    var dropContainer = $('<div class="image-drop-container">').appendTo(container);
    
    dropContainer.on('dragenter', function(e) {
      e.preventDefault();
      $(this).addClass('drag-enter');
    }).on('dragover', function(e) {
      e.preventDefault();
    }).on('dragleave', function(e) {
      $(this).removeClass('drag-enter');
    }).on('drop', function(e) {
      $(this).removeClass('drag-enter');
      e.preventDefault();
      var image = e.originalEvent.dataTransfer.files[0];
      if (image.type !== 'image/jpeg' && image.type !== 'image/png') {
        ui.showError('Wrong file type');
      } else {
        var reader = new FileReader();
        reader.onloadend = function () {
          var bin = this.result;
          $('.drop-image').on('load', function() {
            var width  = this.naturalWidth  || this.width;
            var height = this.naturalHeight || this.height; 
            if (width !== 320 || height !== 320) {
              console.log('error');
              ui.showError('320x320 please');
              if (data.img) {
                img.prop('src', data.img);
              }
            } else {
              $('.image-drop-container').addClass('dropped-image');
              $('#image_name').focus();
            }
          });
          $('.drop-image').attr('src',bin);
        }
        reader.readAsDataURL(image);  
      }      
    });
    var img = $('<img src="" class="drop-image" />').appendTo(dropContainer);
    
    var preinputfield = $('<div class="name-of-image">').appendTo(dropContainer);
    var inputfield = $('<div class="input-field">').appendTo(preinputfield);
    var field = $('<input id="image_name" type="text" class="validate" maxlength="300">').appendTo(inputfield);
    var label = $('<label for="image_name">Image Name</label>').appendTo(inputfield);

    // Edition caps
    if (data.img) {
      img.prop('src', data.img);
      dropContainer.addClass('dropped-image');
    }

    if (data.name) {
      field.val(data.name).addClass('valid');
      label.addClass('active');
    }

    if (typeof(data.index) !== 'undefined') {
      $('<input type="hidden" id="editingRecord">').val(data.index).appendTo(dropContainer);
    }

    // Submit button
    var submitButton = $('<button class="btn waves-effect waves-light">').html('Submit<i class="material-icons right">send</i>').appendTo(preinputfield);
    submitButton.on('click', function() {
      $('#editingRecord').length ? db.update({
        index: $('#editingRecord').val(),
        name: $('#image_name').val(),
        img: $('.drop-image').attr('src')
      }, function() {
        $('.create_record').remove();
        ui.fillData();
      }) : db.insert({
        name: $('#image_name').val(),
        img: $('.drop-image').attr('src')
      }, function() {
        $('.create_record').remove();
        ui.fillData();
      })      
    });

    // Cancel button
    ui.button({
      content: '<i class="material-icons">close</i>',
      floating: true,
      size: 'large',
      color: 'white',
      onClick: function() {
        $('.create_record').remove();
      }
    }).appendTo(dropContainer);
  }
}

/*
 * Utils: Just the stuff that doesn't deserve their own object
 */
var utils = {
  loadDataFromJSON: function(callback) {
    $.getJSON( "data/basic.json", function( data ) {
      callback(data);
    });
  }
};

/*
 * Global vars and init
 */

var db = new dataBase();
var ui = new interface();

$( document ).ready(function() {
  ui.init();

  db.retrieve( function() {
    ui.showData();
  } );
});
