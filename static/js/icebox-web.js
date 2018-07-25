//app state
var state = null;
var state_consumerManagement = 'consumerManagement';
var state_drinkselection = 'drinkselection';
var state_drinkInventory = 'drinkinventory';
var state_rechargeAccount = 'recharceAccount';
var state_configureaccount = 'configureaccount';

var iceBoxIp = 'localhost';
var iceBoxPort = 8081;
var iceBoxNS = 'http://';

var username = '';
var avatarmail = '';

var drinks = {};
var drink = {};
var consumers = {};
var consumer = {};

$(document).ready(function () {
  console.log("document.ready");
  ready();
});

function ready() {
  console.log("ready()");
  initializeUsernameFromCookie();
  registerClickHooks();

  getDataFromServer(function () {
    login(username);
    console.log("now render content");
    renderContent();
  });
}

function getDataFromServer(callback) {
  getIceBoxIp(function () {
    getDrinkData(callback);
  });
}

function initializeUsernameFromCookie() {
  console.log("initializeUsernameFromCookie");

  var cookie = Cookies.get('username');
  if (!(cookie === undefined || cookie == '')) {
    username = cookie;
  }
}

function registerClickHooks() {
  console.log("registerClickHooks " + state);

  //unregister all hooks
  $('#body').off();

  //re-register
  $('#body').on('click', '.loginLink', function (e) {
    console.log("log....");
    state = state_consumerManagement;
    renderContent();
  });

  $('#body').on('click', '#logout', function (e) {
    console.log("logout");
    logout();
    state = state_drinkselection;
    renderContent();
  });

  $('#body').on('click', '#submitnewregistration', function (e) {
    console.log('REGISTER NEW USER!?!?!?');

    var u = $('#inputUsername').val();
    console.log(u);

    registerNewUser(u, function (result) {
      if(result.username == undefined) {
        state = state_consumerManagement;
        ready();
      } else {
        console.log("result from new user thing..." + result);
        console.log(result.username);

        login(result.username);
        state = state_configureaccount;

        renderContent();
      }
    });
  });

  $('#body').on('click', '#submitCorrection', function (e) {
    console.log("SUBMT CORRECTION!!!!");
    var inputBarcode = drink.barcode;

    var inputFullPrice = drink.fullprice;
    if ($('#inputFullPrice').val() == '') {} else {
      inputFullPrice = parseInt($('#inputFullPrice').val());
    }

    var inputDiscountprice = drink.discountprice;
    if ($('#inputDiscountprice').val() == '') {} else {
      console.log("discountprice not empty...");
      inputDiscountprice = parseInt($('#inputDiscountprice').val());
    }

    var inputQuantity = drink.quantity;
    if ($('#inputQuantity').val() == '') {} else {
      inputQuantity = parseInt($('#inputQuantity').val());
    }

    var inputEmpties = drink.empties;
    if ($('#inputEmpties').val() == '') {} else {
      inputEmpties = parseInt($('#inputEmpties').val());
    }

    correctInventory(inputBarcode, inputFullPrice, inputDiscountprice, inputQuantity, inputEmpties, function (result) {
      console.log("Submitted Inventory Correction to server");
    });
  });

  $('#body').on('click', '#submitNewDrink', function (e) {
    console.log("SUBMT NEW DRINK!!!!");

    var inputNameNew = '';
    if ($('#inputNameNew').val() == '') {
      return;
    } else {
      inputNameNew = $('#inputNameNew').val();
    }

    var inputBarcodeNew = '';
    if ($('#inputBarcodeNew').val() == '') {
      return;
    } else {
      inputBarcodeNew = $('#inputBarcodeNew').val();
    }

    var inputFullPrice = 150;
    if ($('#inputFullPriceNew').val() == '') {
      inputFullPrice = 150;
    } else {
      inputFullPrice = parseInt($('#inputFullPriceNew').val());
    }

    var inputDiscountprice = 125;
    if ($('#inputDiscountpriceNew').val() == '') {
      inputDiscountprice = 125;
    } else {
      console.log("discountprice not empty...");
      inputDiscountprice = parseInt($('#inputDiscountpriceNew').val());
    }

    var inputQuantity = 0;
    if ($('#inputQuantityNew').val() == '') {
      inputQuantity = 0;
    } else {
      inputQuantity = parseInt($('#inputQuantityNew').val());
    }

    var inputEmpties = 0;
    if ($('#inputEmptiesNew').val() == '') {
      inputEmpties = 0;
    } else {
      inputEmpties = parseInt($('#inputEmptiesNew').val());
    }

    console.log('try to submit new drink');
    submitNewDrinkToServer(inputNameNew, inputBarcodeNew, inputFullPrice, inputDiscountprice, inputQuantity, inputEmpties, function (result) {
      console.log("Submitted new drink to server.");
    });
  });

  $('#body').on('click', '#userSelection', function (e) {
    console.log('#userSelection');
    console.log(e.target.dataset.code);

    login(e.target.dataset.code)
    state = state_drinkselection;

    console.log("render from user selection");
    renderContent();
  });

  $('#body').on('click', '#drinkConfigure', function (e) {
    console.log('#drinkConfigure');

    var barcode = e.target.dataset.code;
    for (var i in drinks) {
      if (drinks[i].barcode == barcode) {
        drink = drinks[i];
      }
    }

    console.log("render from drink config");
    renderContent();
  });

  $('#body').on('click', '#drinkSelection', function (e) {
    console.log('#drinkSelection');

    var barcode = e.target.dataset.code;
    drinkSelection(barcode, function () {
      ready();
    });
  });

  $('#body').on('click', '#brand', function (e) {
    console.log('#brand');

    state = state_drinkselection;

    console.log("render from brand");
    renderContent();
  });

  $('#body').on('click', '#inventory', function (e) {
    console.log('#inventory');

    state = state_drinkInventory;

    console.log("render from inventory");
    renderContent();
  });

  $('#body').on('click', '#rechargeaccount', function (e) {
    console.log('#rechargeaccount');

    state = state_rechargeAccount;

    console.log("render from recharge...");
    renderContent();
  });

  $('#body').on('click', '.euroSelection', function (e) {
    console.log(".euroSelection");

    var submission = e.target.dataset.code;

    rechargeAccount(submission, function () {
      console.log("back from recharge... render")
      state = state_drinkselection;
      ready();
    });
  });

  $('#body').on('click', '#configureaccount', function (e) {
    console.log("#configureaccount");

    state = state_configureaccount;

    renderContent();
  });

  $('#body').on('click', '#submitUserdata', function (e) {
    console.log("#submitUserdata");

    var vds = $('#inputVds').is(':checked');
    var avatarmail = $('#inputAvatarmail').val();

    submitUserdata(avatarmail, vds);
  });
}

function rechargeAccount(submission, callback) {
  console.log(".euroSelection");

  var valueToRecharge = 0;
  if (submission == '5') {
    valueToRecharge = 500;
  }
  if (submission == '10') {
    valueToRecharge = 1000;
  }
  var dialog = bootbox.dialog({
    message: 'Hast du das Geld wirklich in die Box gelegt?',
    title: "Just checkin'",
    buttons: {
      success: {
        label: "Ja",
        className: "btn-success",
        callback: function () {
          dialog.modal('hide');
          rechargeAccoundWith(valueToRecharge, callback);
        }
      },
      danger: {
        label: "Nope",
        className: "btn-danger",
        callback: function () {}
      }
    }
  });
}

function drinkSelection(barcode, callback) {
  var drinkName = '';
  var money = 1.5;

  for (var i in drinks) {
    if (drinks[i].barcode == barcode) {
      drinkName = drinks[i].name;
      money = amountInEuro(drinks[i].fullprice);

      if (userIsLoggedIn()) {
        money = amountInEuro(drinks[i].discountprice);
      }
    }
  }

  var dialog = bootbox.dialog({
    message: '"' + drinkName + '" für ' + money + ' € kaufen?',
    title: "You sure Bro?",
    buttons: {
      success: {
        label: "Ja",
        className: "btn-success",
        callback: function () {
          dialog.modal('hide');
          buyDrink(barcode, callback);
        }
      },
      danger: {
        label: "Noooooooooo",
        className: "btn-danger",
        callback: function () {}
      }
    }
  });
}

function submitUserdata(mail, vdsFlag) {
  $.ajax({
    url: iceBoxNS + iceBoxIp + ":" + iceBoxPort + "/consumers/" + encodeURIComponent(username),
    type: 'PUT',
    data: {
      avatarmail: mail,
      vds: vdsFlag
    },
    crossDomain: true,
    dataType: 'json',
    success: function (consumer) {
      console.log("call ready from submit user data...");
      ready();
    },
    error: function (jqXHR, textStatus, error) {}
  });
}

function rechargeAccoundWith(amountx, callback) {
  console.log("recharge account " + amountx);
  console.log("recharge account for " + username);

  $.ajax({
    url: iceBoxNS + iceBoxIp + ":" + iceBoxPort + "/consumers/" + encodeURIComponent(username) + '/deposit',
    type: 'POST',
    data: {
      amount: amountx
    },
    crossDomain: true,
    dataType: 'json',
    success: function (consumer) {
      callback();
    },
    error: function (jqXHR, textStatus, error) {}
  });
}

function correctInventory(inputBarcode, inputFullPrice, inputDiscountprice, inputQuantity, inputEmpties) {
  console.log("here we would correct a drink");
  console.log(inputBarcode + ', ' + inputFullPrice + ', ' + inputDiscountprice + ', ' + inputQuantity + ', ' + inputEmpties);

  $.ajax({
    url: iceBoxNS + iceBoxIp + ":" + iceBoxPort + "/drinks/" + inputBarcode,
    type: 'PUT',
    data: {
      barcode: inputBarcode,
      fullprice: inputFullPrice,
      discountprice: inputDiscountprice,
      quantity: inputQuantity,
      empties: inputEmpties
    },
    crossDomain: true,
    dataType: 'json',
    success: function (consumer) {
      ready();
    },
    error: function (jqXHR, textStatus, error) {}
  });
}

function submitNewDrinkToServer(inputNameNew, inputBarcodeNew, inputFullPrice, inputDiscountprice, inputQuantity, inputEmpties, callback) {
  console.log("new drink....");

  $.ajax({
    url: iceBoxNS + iceBoxIp + ":" + iceBoxPort + "/drinks/",
    type: 'POST',
    data: {
      name: inputNameNew,
      barcode: inputBarcodeNew,
      fullprice: inputFullPrice,
      discountprice: inputDiscountprice,
      quantity: inputQuantity,
      empties: inputEmpties
    },
    crossDomain: true,
    dataType: 'json',
    success: function (consumer) {
      displaySucesfullBuy(callback);
    },
    error: function (jqXHR, textStatus, error) {
      displayNotBought(callback);
    }
  });
}

function buyDrink(barcode, callback) {
  var user = username;

  if (username == '') {
    user = 'Anon';
  }

  $.ajax({
    url: iceBoxNS + iceBoxIp + ":" + iceBoxPort + "/consumptions/" + encodeURIComponent(username),
    type: 'POST',
    data: {
      barcode: barcode
    },
    crossDomain: true,
    dataType: 'json',
    success: function (consumer) {
      displaySucesfullBuy(callback);
    },
    error: function (jqXHR, textStatus, error) {
      displayNotBought(callback);
    }
  });
}

function displayNotBought(callback) {
  var dialog = bootbox.dialog({message: 'OH NOOOO! SOMETHING WENT WRONG', title: ""});

  setTimeout(function () {
    dialog.modal('hide');
    callback();
  }, 5000);
}

function displaySucesfullBuy(callback) {
  var dialog = bootbox.dialog({message: 'Thank You! Come again!', title: ""});

  setTimeout(function () {
    dialog.modal('hide');
    callback();
  }, 2000);
}

function registerNewUser(u, callback) {
  $.ajax({
    url: iceBoxNS + iceBoxIp + ":" + iceBoxPort + "/consumers/",
    type: 'POST',
    data: {
      username: u
    },
    crossDomain: true,
    dataType: 'json',
    success: function (consumer) {
      callback(consumer);
    },
    error: function (jqXHR, textStatus, error) {
      callback(textStatus);
    }
  });
}

function login(u) {
  username = u;

  Cookies.set('username', username, {
    expires: 365,
    path: '/'
  });

  for (var i in consumers) {
    if (consumers[i].username == u) {
      consumer = consumers[i];
      avatarmail = consumer['avatarmail'];
    }
  }
}

function logout() {
  Cookies.set('username', '', {
    expires: 1,
    path: '/'
  });

  username = '';
  consumer = {};
}

function getIceBoxIp(callback) {
  $.ajax({
    url: "serviceip",
    type: 'GET',
    crossDomain: true,
    dataType: 'json',
    success: function (connectionData) {
      iceBoxIp = connectionData.ip;
      if (iceBoxIp == '::') {
        iceBoxIp = 'localhost';
      }

      iceBoxPort = connectionData.port || 8081;

      iceBoxNS = window.location.protocol == 'http' ? 'http://' : 'proxy/';

      callback();
    },
    error: function (error) {
      console.log("Failed to retrieve the Service IP from Icebox API");
      throw error;
    }
  });
}

function getDrinkData(callback) {
  $.ajax({
    url: iceBoxNS + iceBoxIp + ":" + iceBoxPort + "/drinks",
    type: 'GET',
    crossDomain: true,
    dataType: 'json',
    success: function (drinksData) {
      drinks = drinksData;
      getUserData(callback);
    },
    error: function () {
      console.log("Failed to retrieve the list of drinks from Icebox API");
    }
  });
}

function getUserData(callback) {
  $.ajax({
    url: iceBoxNS + iceBoxIp + ":" + iceBoxPort + "/consumers",
    type: 'GET',
    crossDomain: true,
    dataType: 'json',
    success: function (consumersData) {
      consumers = consumersData;
      callback();
    },
    error: function () {
      console.log("Failed to retrieve the list of consumers from the Icebox API");
    }
  });
}

function getAvatarURI(avatarmail) {
  if(avatarmail === null) {
    avatarmail = '';
  }

  return 'https://www.gravatar.com/avatar/'+md5(avatarmail.toLowerCase())+'?s=16&d=mm&r=g';
}

function renderContent() {
  console.log("render");

  $('#body').empty();
  renderNavbar();
  addMain();

  if (state === null) {
    state = state_drinkselection;
  }

  if (state === state_consumerManagement) {
    renderUserChoice();
    renderNewUserRegistrationForm();
  }

  if (state === state_drinkselection) {
    renderDrinkSelection();
  }

  if (state === state_drinkInventory) {
    renderInventory();
  }

  if (state === state_rechargeAccount) {
    renderRechargeAccount();
  }

  if (state === state_configureaccount) {
    renderConfigureAccount();
  }
}

function renderConfigureAccount() {
  var containerfluid = $('<div class="container-fluid" id="inventoryform"></div>');
  var desc = $('<p class="lead">Einstellungen für ' + username + '</p>')
  desc.appendTo(containerfluid);

  var row = $('<div class="row"></div>');
  var registerForm = $('<form class="form-horizontal" role="form">');
  row.appendTo(registerForm);

  var avatarmail = consumer.avatarmail;
  if (avatarmail == null) {
    avatarmail = '';
  }

  var checked = ''
  if (consumer.vds) {
    console.log("checked...");
    checked = 'checked="checked"';
  }

  $('<div class="col-sm-6 col-lg-4"><div class="form-group"><label for="inputAvatarmail" class="col-md-4 control-label">Avatar Mail</label><div class="col-md-8"><input type="text" class="form-control" id="inputAvatarmail" value = "' + avatarmail + '" placeholder="' + avatarmail + '"></div></div></div>').appendTo(row);
  $("#inputAvatarmail").val(avatarmail);
  $('<div class="col-sm-6 col-lg-4"><div class="form-group"><label for="inputVds" class="col-md-4 control-label">Daten Loggen</label><div class="col-md-8"><input type="checkbox" class="form-control" id="inputVds" ' + checked + '></div></div></div>').appendTo(row);

  $('<div class="col-sm-12 col-lg-4"><button type="submit" class="btn btn-default" id="submitUserdata">Korrigieren</button></div>').appendTo(row);

  $('<div><p>Alle Daten in diesem Formular sind freiwillig und für eine gültige Registrierung nicht notwendig. Wenn du keine Einstellungen vornehmen möchtest, klicke einfach auf <i>IceBox</i> oben links.</p><p></p><p><b>Avatar Mail:</b> Clients können diese Mail nutzen um über Dienste wie Gravatar einen Avatar für den User anzuzeigen.<p><p><b>Daten Loggen:</b> Icebox kann speichern, wann du welches Getränk trinkst, um z.B. lustige Statistiken zu erzeugen oder aber, auch dir zu ermöglichen, deinen Koffein oder Zuckerkonsum zu kontrollieren.</p></div>').appendTo(containerfluid);

  registerForm.appendTo(containerfluid);
  containerfluid.appendTo('#main');
}

function renderRechargeAccount() {
  console.log("recharge...");

  var containerfluid = $('<div class="container-fluid"></div>');
  var row = $('<div class="row"></div>');

  var euroDiv = $('<div class="col-sm-12 col-lg-12""></div>');
  var eurofive = $('<p><a href="#" class="btn-flat btn-block btn btn-primary btn-moneyselect euroSelection" data-code="5" role="button"><img src="image/euro5.jpg" height=200px data-code="5" align="center"></a>');
  var euroten = $('<p><a href="#" class="btn-flat btn-block btn btn-primary btn-moneyselect euroSelection" data-code="10" role="button"><img src="image/euro10.jpg" height=200px data-code="10" align="center"></a>');

  eurofive.appendTo(euroDiv);
  euroten.appendTo(euroDiv);
  euroDiv.appendTo(row);

  row.appendTo(containerfluid);

  $('<p><i>Es wird darauf hingewiesen, das nach Beschluss des Vereins, Guthaben, welches länger als ein Jahr nicht genutzt wurde verfallen kann.</i></p>').appendTo(containerfluid);

  containerfluid.appendTo('#main');
}

function renderInventory() {
  for (var i in drinks) {
    if (Object.keys(drink).length === 0) {
      console.log("WE SELECT AN ACTIVE DRINK BECAUSE NONE WAS SELECTED");
      drink = drinks[i];
    } else {
      //TODO: Update drinkdata, to see the new numbers after pressing the button
      if (drinks[i].barcode == drink.barcode) {
        drink = drinks[i];
      }
    }
  }

  var containerfluid = $('<div class="container-fluid" id="inventoryform"></div>');
  var desc = $('<p class="lead">Getränkeinventur für ' + drink.name + ':</p>')
  desc.appendTo(containerfluid);

  var row0 = $('<div class="row"></div>');
  var inventoryForm = $('<form class="form-horizontal" role="form">');
  row0.appendTo(inventoryForm);

  $('<div class="col-sm-12 col-lg-4"><div class="form-group"><label for="inputBarcode" class="col-md-4 control-label">Barcode:</label><div class="col-md-8"><input type="text" readonly class="form-control" id="inputBarcode" placeholder="' + drink.barcode + '"></div></div></div>').appendTo(row0);
  $('<div class="col-sm-12 col-lg-4"><div class="form-group"><label for="inputFullPrice" class="col-md-4 control-label">Preis:</label><div class="col-md-8"><input type="text" class="form-control" id="inputFullPrice" placeholder="' + drink.fullprice + '"></div></div></div>').appendTo(row0);
  $('<div class="col-sm-12 col-lg-4"><div class="form-group"><label for="inputDiscountprice" class="col-md-4 control-label">Reduzierter Preis:</label><div class="col-md-8"><input type="text" class="form-control" id="inputDiscountprice" placeholder="' + drink.discountprice + '"></div></div></div>').appendTo(row0);
  $('<div class="col-sm-12 col-lg-4"><div class="form-group"><label for="inputQuantity" class="col-md-4 control-label">Anzahl:</label><div class="col-md-8"><input type="text" class="form-control" id="inputQuantity" placeholder="' + drink.quantity + '"></div></div></div>').appendTo(row0);
  $('<div class="col-sm-12 col-lg-4"><div class="form-group"><label for="inputEmpties" class="col-md-4 control-label">Leergut:</label><div class="col-md-8"><input type="text" class="form-control" id="inputEmpties" placeholder="' + drink.empties + '"></div></div></div>').appendTo(row0);

  $('<div class="col-sm-12 col-lg-4"><button type="submit" class="btn btn-default" id="submitCorrection">Korrigieren</button></div>').appendTo(row0);

  inventoryForm.appendTo(containerfluid);
  containerfluid.appendTo('#main');

  var row1 = $('<div class="row"></div>');
  for (var i in drinks) {
    console.log(drink.name);
    console.log(drink.barcode);

    if (drinks[i].barcode == drink.barcode) {
      console.log(drink.name);
      addClass = 'active';
    } else {
      addClass = '';
    }

    var drinkName = drinks[i].name;
    var barcode = drinks[i].barcode;
    var drinkimage = mapDrinkImage(drinks[i]);
    var drinkDiv = $('<div class="col-sm-6 col-lg-2""></div>');
    var drinkName = $('<p><a href="#" class="btn-flat btn-block btn btn-primary btn-drinkselect ' + addClass + '" data-code="' + barcode + '" id="drinkConfigure" role="button"><img src="' + drinkimage + '" height=200px data-code="' + barcode + '" align="center"> </br>' + drinkName + '</a>')

    drinkName.appendTo(drinkDiv);
    drinkDiv.appendTo(row1);

    console.log(drinkName);
  }
  row1.appendTo('#main');

  var containerfluid2 = $('<div class="container-fluid" id="newdrinkform"></div>');
  var desc2 = $('<p class="lead">Neues Getränk</p>')
  desc2.appendTo(containerfluid2);

  var row2 = $('<div class="row"></div>');
  var newDrinkForm = $('<form class="form-horizontal" role="form">');
  row2.appendTo(newDrinkForm);

  $('<div class="col-sm-12 col-lg-4"><div class="form-group"><label for="inputNameNew" class="col-md-4 control-label">Name:</label><div class="col-md-8"><input type="text" class="form-control" id="inputNameNew" placeholder=""></div></div></div>').appendTo(row2);
  $('<div class="col-sm-12 col-lg-4"><div class="form-group"><label for="inputBarcodeNew" class="col-md-4 control-label">Barcode:</label><div class="col-md-8"><input type="text" class="form-control" id="inputBarcodeNew" placeholder=""></div></div></div>').appendTo(row2);
  $('<div class="col-sm-12 col-lg-4"><div class="form-group"><label for="inputFullPriceNew" class="col-md-4 control-label">Preis:</label><div class="col-md-8"><input type="text" class="form-control" id="inputFullPriceNew" placeholder=""></div></div></div>').appendTo(row2);
  $('<div class="col-sm-12 col-lg-4"><div class="form-group"><label for="inputDiscountpriceNew" class="col-md-4 control-label">Reduzierter Preis:</label><div class="col-md-8"><input type="text" class="form-control" id="inputDiscountpriceNew" placeholder=""></div></div></div>').appendTo(row2);
  $('<div class="col-sm-12 col-lg-4"><div class="form-group"><label for="inputQuantityNew" class="col-md-4 control-label">Anzahl:</label><div class="col-md-8"><input type="text" class="form-control" id="inputQuantityNew" placeholder=""></div></div></div>').appendTo(row2);
  $('<div class="col-sm-12 col-lg-4"><div class="form-group"><label for="inputEmptiesNew" class="col-md-4 control-label">Leergut:</label><div class="col-md-8"><input type="text" class="form-control" id="inputEmptiesNew" placeholder=""></div></div></div>').appendTo(row2);

  $('<div class="col-sm-12 col-lg-4"><button type="submit" class="btn btn-default" id="submitNewDrink">Neu Anlegen</button></div>').appendTo(row2);

  newDrinkForm.appendTo(containerfluid2);
  containerfluid2.appendTo('#main');
}

function renderUserChoice() {
  console.log("render user choice.")

  var containerfluid = $('<div class="container-fluid"></div>');

  var row1 = $('<div class="row"></div>');
  for (var i in consumers) {
    var user = consumers[i].username;
    var avatar = consumers[i].avatarmail;
    var userdiv = $('<div class="col-sm-6 col-lg-2"></div>');
    var userava = '';
    if(!(avatar == '')) {
      var userava = '<img src="'+getAvatarURI(avatar)+'" width="16" height="16"/>';
      //userava.appendTo(userdiv);
    }
    var username = $('<p><a href="#" class="btn-flat btn-block btn btn-primary usernamediv" data-code="' + user + '" id="userSelection" role="button">' + userava + $('<div/>').text(user).html() + '</a>')

    username.appendTo(userdiv);
    userdiv.appendTo(row1);
    console.log("-> "+user);
  }
  row1.appendTo(containerfluid);

  containerfluid.appendTo('#main');
}

function renderNewUserRegistrationForm() {
  var containerfluid = $('<div class="container-fluid" id="registrationform"></div>');

  var desc = $('<p class="lead">Als neuer User Registrieren:</p>')
  desc.appendTo(containerfluid);

  var row1 = $('<div class="row"></div>');
  var registerForm = $('<form class="form-horizontal" role="form">');
  row1.appendTo(registerForm);

  $('<div class="col-sm-6 col-lg-4"><div class="form-group"><label for="inputUsername" class="col-md-4 control-label">Username:</label><div class="col-md-8"><input type="text" class="form-control" id="inputUsername" placeholder="Username"></div></div></di' +
'v>').appendTo(row1);
  $('<div class="col-sm-12 col-lg-4"><button type="submit" class="btn btn-default" id="submitnewregistration">Registrieren</button></div>').appendTo(row1);
  $('<p><i>Es wird darauf hingewiesen, das nach Beschluss des Vereins, Guthaben, welches länger als ein Jahr nicht genutzt wurde verfallen kann.</i></p>').appendTo(row1);

  registerForm.appendTo(containerfluid);

  containerfluid.appendTo('#main');
}

function renderNavbar() {
  console.log("render Navbar");
  var navbar = $('<nav class="navbar navbar-default"></nav>');

  var containerfluid = $('<div class="container-fluid"></div>');
  containerfluid.appendTo(navbar);

  var navheader = $('<div class="navbar-header"></div>');
  navheader.appendTo(containerfluid);

  var collapsebutton = $('<button type="button" class="navbar-toggle collapsed" data-toggle="collapse" data-target="#navbar1" aria-expanded="false"><span class="sr-only">Toggle navigation</span><span class="icon-bar"></span><span class="icon-bar"></span><span class="icon-bar"' +
    '></span></button>');
  collapsebutton.appendTo(navheader);

  var brand = $('<a class="navbar-brand" href="#" id="brand">IceBox</a>');
  brand.appendTo(navheader);

  var navbar1 = $('<div class="collapse navbar-collapse" id="navbar1"></div>');
  navbar1.appendTo(containerfluid);

  var navbarlist = $('<ul class="nav navbar-nav" id="navbarlist"></ul>');
  navbarlist.appendTo(navbar1);

  var inventurLink = $('<li><a href="#" id="inventory">Inventur</a></li>');
  inventurLink.appendTo(navbarlist);

  var dokuLink = $('<li><a href="http://'+iceBoxIp+':'+iceBoxPort+'/">API-Doku</a></li>');
  dokuLink.appendTo(navbarlist);

  navbar.appendTo('#body');

  renderLoginButton();
  renderLedger();
}

function userIsLoggedIn() {
  return !username == '';
}

function renderLoginButton() {
  console.log("renderLoginButton");
  if (!userIsLoggedIn()) {
    $('<li class="nav-item"><a class="nav-link loginLink" href="#" id="loginLink"><span class="glyphicon glyphicon-log-in" aria-hidden="true"> Login </span></a></li>').appendTo('#navbarlist');
/*  } else if(!(avatarmail == "")) {
    $('.glyphicon-avatar::before').css({
'display': 'inline-block',
'height': '16px',
'min-height': '16px',
'width': '16px',
'min-width': '16px',
'background-image': 'url('+getAvatarURI(avatarmail)+')'
    });
    $('<li class="nav-item"><a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false"><span class="glyphicon glyphicon-avatar" aria-hidden="true"> ' + $('<div/>').text(username).html() + '<span class="caret"></span></span></a> <ul class="dropdown-menu"><li><a href="#" id="rechargeaccount">Konto aufladen</a></li><li><a href="#" id="configureaccount">Einstellungen</a></li><li><a href="#" id="logout">Log out</a></li></ul></li>').appendTo('#navbarlist'); */
  } else {
    $('<li class="nav-item"><a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false"><span class="glyphicon glyphicon-user" aria-hidden="true"> ' + $('<div/>').text(username).html() + '<span class="caret"></span></span></a> <ul class="dropdown-menu"><li><a href="#" id="rechargeaccount">Konto aufladen</a></li><li><a href="#" id="configureaccount">Einstellungen</a></li><li><a href="#" id="logout">Log out</a></li></ul></li>').appendTo('#navbarlist');
  }
}

function renderLedger() {
  var euro = amountInEuro(consumer.ledger);

  if (userIsLoggedIn()) {
    $('<li class="nav-item"><p class="navbar-text"><span class="glyphicon glyphicon-euro" aria-hidden="true"> ' + euro + ' </span></p></li>').appendTo('#navbarlist');
  }
}

function renderDrinkSelection() {
  console.log("render drinks");

  var row1 = $('<div class="row"></div>');
  for (var i in drinks) {
    if (drinks[i].quantity > 0) {
      var drinkName = drinks[i].name;
      var barcode = drinks[i].barcode;
      var drinkimage = mapDrinkImage(drinks[i]);
      var drinkDiv = $('<div class="col-sm-12 col-lg-2""></div>');
      var drinkName = $('<p><a href="#" class="btn-flat btn-block btn btn-primary btn-drinkselect" data-code="' + barcode + '" id="drinkSelection" role="button"><img src="' + drinkimage + '" height=200px data-code="' + barcode + '" align="center"> </br>' + $('<div/>').text(drinkName).html() + '</a>')
      drinkName.appendTo(drinkDiv);
      drinkDiv.appendTo(row1);
    }
  }
  row1.appendTo('#body');
}

/*
* service for images
*/
function mapDrinkImage(drink) {
  return "image/" + drink.barcode + ".png";
//Fallback to bottle.png (should be done on client-side)
//  return "bottle.png";
}

function addMain() {
  var main = $('<div id="main"></div>');
  main.appendTo("#body");
}

function amountInEuro(amount) {
  return (amount / 100).toFixed(2);
}
