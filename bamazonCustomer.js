var mysql = require('mysql');
var inquirer = require('inquirer');
var itemsArr = [], itemsIdArr = [];
var connection = mysql.createConnection({
    host: "localhost",
    port: "3306",
    user: "root",
    password: "",
    database: "bamazon"
});

connection.connect(function (err) {
    if (err) {
        console.error('error connecting: ' + err.stack);
        return;
    }
    startBusiness();
});

function getItemAndQualtityfromUser(itemsIdArr) {
    inquirer
    .prompt([
      {
        name: "item_id",
        type: "input",
        message: "Enter the ITEM_ID you want to buy?",
        validate: function(value) {
          if (isNaN(value) === false && itemsIdArr.includes(parseInt(value))) {
            return true;
          }
          console.log('\nPlease choose Item_ID from the list: '+itemsIdArr);
          return false;
        }
      },
      {
        name: "requestQuantity",
        type: "input",
        message: "Enter the Quantity you want to buy?",
        validate: function(value) {
          if (isNaN(value) === false) {
            return true;
          }
          return false;
        }
      }
    ])
    .then(function(answer) {
        var requestedItemId = parseInt(answer.item_id);
        var requestedQty = parseInt(answer.requestQuantity);
        var itemAvailable = false;
        isItemAvailable(requestedItemId, requestedQty, function(value){
            itemAvailable = value;
            if (itemAvailable) {
                displayOrderConfirmationAndUpdateDB(requestedItemId, requestedQty);
            } else {
                console.log("Sorry, Insufficient Quantity !!!")
            }
        });
    });
}

function displayOrderConfirmationAndUpdateDB(itemId, requestedQty) {
    var remainingQty=0;
    itemsArr.forEach(function(item, index){
        if (parseInt(item.item_id) === itemId) {
            console.log("\n######### ORDER PLACED SUCCESSFULLY ############# ");
            console.log("##   Product: "+item.product_name);
            console.log("##   Quantity: "+requestedQty);
            console.log("##   TOTAL COST : $"+requestedQty*item.price);
            console.log("#################################################\n ");
            remainingQty = parseInt(item.stock_quantity) - parseInt(requestedQty);
        }
    })

    var query = "UPDATE products SET stock_quantity=? WHERE item_id=?;"
    connection.query(query, [remainingQty, itemId], function(err, results){
        if (err) throw err;
        console.log('Quantity updated, remaining Quantity : '+remainingQty);
    })
    endDBConnection();
}

function isItemAvailable(itemId, qtyRequested, callback) {
    var query = "select stock_quantity from products where item_id=?";
    var qty=0;
    var itemAvail = false;
    connection.query(query, itemId, function (error, results) {
        if (error) {
            console.log(error);
        }
        qty = results[0].stock_quantity;
        if (qtyRequested <= qty) {
            itemAvail = true;
        } else {
            itemAvail = false;
        }
        callback(itemAvail);
    })

}

function startBusiness() {

    connection.query('select item_id, product_name, price, stock_quantity from products;', function (error, results) {
        
        console.log("\n#####   ITEMS AVAILABLE FOR PURCHASE    ######\n")
        console.log("ITEM_ID    PRICE   PRODUCT_NAME    ")
        for (var i = 0; i < results.length; i++) {
            itemsArr[i] = results[i];
            itemsIdArr.push(results[i].item_id);
            console.log(results[i].item_id + "          $ " + results[i].price + "      " + results[i].product_name);
            
        }
        console.log("\n###############################################\n")
        getItemAndQualtityfromUser(itemsIdArr);
    })
}

function endDBConnection() {
    connection.end();
}

