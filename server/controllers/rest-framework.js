/*****************************************************************************\
 | Server : controllers/rest-framework.js                                      |
 |                                                                             |
 | Email: shakib.bin.hamid@gmail.com                                           |
 | version 0.0.1                                                               |
 | Copyright Shakib-Bin Hamid                                                  |
 |*****************************************************************************|
 | This is a simple REST framework generator. You can use                      |
 |      the GET, POST, PUT, DELETE methods                                     |
 |      add middlewares                                                        |
 \*****************************************************************************/

// Object is always saved with the req.data properties.
// Can run a pre hook or a post hook.
// If post hook is provided, user has to send their own response in the post cb
// If no post hook is given,
//     on success -> 201 : send object
//     on notFound/error -> 400 : send message
//
// model -> The name of the model to post. required to log.
// object -> The object to post. An instantiation of the model.
// req -> The http req object. Used to prepare the provided object with req.body.
// res -> The http res object. Used to send a response if no callback is given.
// pre -> The pre hook. Injected if provided, i.e. done before calling save on object.
// post -> The post hook. Injected if provided.
exports.post = function (model, object, req, res, pre, post) {

    console.log(req.headers.host + ' ' + req.method + ' ' + req.originalUrl);

    for (var prop in req.body) //Copy the properties of Thing
        object[prop] = req.body[prop];

    var save = function(cb){
        exports.save(object, function (err) {
            res.status(400).json({message: 'ERROR: '+ model +' Not Added!'});
        }, function (obj) {
            if (cb) cb(obj);
            else res.status(201).json({message: model + ' Added!', data: obj});
        });
    };

    this.injectMiddleware(object, save, pre, post);

};

// A query is performed and the callbacks are performed.
// If no callbacks are provided, then
//     on success -> 200 : send object
//     on notFound/error -> 400 : send message
//
// If callbacks are provided, users must send their own reponse in the callbacks
//
// model -> model to get, used for console log and responses
// query -> query to find the object first
// req -> http req object
// rest -> http response object
// errcb -> to be called on err in get, default is sendResponse(errmsg)
// cb -> to be called on callback to findObject, default is update(object)
// notfoundcb -> to be called if notfound, default is sendResponse(notfoundmsg)
exports.get = function (model, query, req, res, errcb, cb, notfoundcb) {

    if (!errcb)
        errcb = this.sendResponse(res, 400);

    if (!cb)
        cb = this.sendResponse(res, 200);

    if (!notfoundcb)
        notfoundcb = this.sendResponse(res, 400);

    this.handleQuery(query, errcb, cb, notfoundcb, 'ERROR: '+ model + ' Not Found!', model + ' Found!', req);

};

// Makes a Query to find the object, then uses req.body to update the retrieved object.
// Sends response if the query fails.
// Can provide callbacks for error/notfound/successful query.
//
// Must include own methods of updating and sending response if cb is provided, default is updateObject.
// Default is ->
//     successful update -> 200 : updated object
//     error/notfound -> 400 : message
//
// model -> model to update, used for console log and responses
// query -> query to find the object first
// req -> http req object
// rest -> http response object
// errcb -> to be called on err in updateThing, default is sendResponse(errmsg)
// cb -> to be called on callback to findObject, default is update(object)
// notfoundcb -> to be called if notfound, default is sendResponse(notfoundmsg)
exports.put = function (model, query, req, res, errcb, cb, notfoundcb) {

    if (!errcb)
        errcb = this.sendResponse(res, 400);

    if (!cb)
        cb = function(obj) {
            exports.updateObject(req, res, obj.data);
        };

    if (!notfoundcb)
        notfoundcb = this.sendResponse(res, 400);

    this.handleQuery(query, errcb, cb, notfoundcb, 'ERROR: '+ model + ' Not Updated!', model + ' Updated!', req);

};

// A query is done to find the object, then is removed from db.
// Can provide callbacks for error/notfound/successful query.
//
// Delete is guaranteed, callbacks are only used as a callback to the delete.
//
// model -> model to delete, used for console log and responses
// query -> query to find the object first
// req -> http req object
// rest -> http response object
// errcb -> to be called on err in deleteThing, default is sendResponse(errmsg)
// cb -> to be called on callback to delete, default is sendResponse(object)
// notfoundcb -> to be called if notfound, default is sendResponse(notfoundmsg)
exports.delete = function (model, query, req, res, errcb, cb, notfoundcb) {

    if (!notfoundcb)
        notfoundcb = this.sendResponse(res, 400);

    var deleteIt = function(obj) {
        exports.remove(req, res, obj, errcb, cb);
    };

    this.handleQuery(query, this.sendResponse(res), deleteIt, notfoundcb, 'ERROR: Cannot Remove '+ model + '!', model + ' Removed from List!', req);

};

// Injects a pre and/or post hook to the action.
// Performs pre (if provided), then expects action to run on object as callback.
// Finally post (if provided), is run as cb to action.
//
// object -> object to perform action on
// action -> method to be called
// pre -> optional pre middleware for action
// post -> optional post middleware for action
exports.injectMiddleware = function(object, action, pre, post){

    if (pre) pre(object, action, post);
    else action(post);

};

// Handles queries. Logs it from req.
// Performs errcb if error,
//          notfoundcb if query returns no objects
//          cb if query returns object.
//
// Note: Empty objects count as found objects e.g. empty array is a valid object.
//
// query -> Mongoose query for example: Model.find(queryObj)
// errcb -> callback for err. expects function(obj)
// cb    -> callback for success. expects function(obj)
// errmsg-> message to send on err, can be null
// msg   -> message to send on success, can be null
// req   -> req obj. Used for logging. can be null
exports.handleQuery = function (query, errcb, cb, notfoundcb, errmsg, msg, req){

    if (req)
        console.log(req.headers.host + ' ' + req.method + ' ' + req.originalUrl);

    query.exec(function(err, obj){
        if (err)
            errcb({ message: errmsg });
        else if (obj)
            cb({ message: msg, data: obj });
        else
            notfoundcb({ message: errmsg });
    });

};

// Returns a function to send a response to the res object.
// code is an optional http status code.
// Usually used as a callback to other methods to send a response
exports.sendResponse = function(res, code) {

    var resFunc = function(obj){
        if (code) res.status(code).json(obj);
        else res.json(obj);
    };
    return resFunc;

};

// Helper method for saving object
// errcb = cb for err
exports.save = function (object, errcb, cb) {

    object.save(function (err, obj) {
        if (err) errcb(err);
        else cb(obj);
    });

};

// Helper method for updating object
// Replaces thing's properties with newThing's properties
exports.update = function (object, newObject, errcb, cb) {

    for (var prop in newObject) //Update the given properties
        object[prop] = newObject[prop];

    this.save(object, errcb, cb);

};

// Helper method to remove a product
// either the callbacks are called, or the responses are sent.
exports.remove = function(req, res, obj, errcb, cb) {

    obj.data.remove(function (err, deleted) {
        if (err) { //Delete Failed
            if (errcb) errcb();
            else exports.sendResponse(res, 400)({message: 'ERROR: Cannot Remove' + '!'});
        } else { //Delete Successful
            if (cb) cb();
            else exports.sendResponse(res, 200)({message: obj.message, data: deleted});
        }
    });

};

// Updates an object and sends responses
exports.updateObject = function(req, res, object){

    this.update(object, req.body, function(err){//Update Failed
        exports.sendResponse(res, 400)({message: 'ERROR: Cannot Update!'});
    }, function(updated){//Update Successful
        exports.sendResponse(res, 200)({message: 'Updated!', data: updated });
    });

};
