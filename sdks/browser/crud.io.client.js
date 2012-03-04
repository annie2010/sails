/**
 * CRUD.io
 * Browser SDK
 * c. Michael McNeil 2012
 *
 * TODO: Use a localStorage cache to store non-secure requests to
 *		the Content Cloud.  Only refresh a node if it goes stale.
 *
 */
(function () {
	
	CRUD = constructor;

	/**
	 * Returns the requested node payload.
	 *
	 * NOTE:
	 * This is a safe way of accessing the functionality of CRUD.get, since
	 * it prevents accessing nodes which were not already fetched on CRUD.io's
	 * initialization.
	 */
	CRUD.prototype.read = function(node) {
		var type,payload;
		
		if (typeof this.cache[node] != "undefined") {
			type = this.cache[node].type;
			payload = this.cache[node].payload;
		}
		else {
			type = 'text';
			payload =
					"The node ("+node+") was not loaded. "+
					"Make sure it is included in your CMS, "+
					"or force another load with crud.get."
		}

		return this.output(payload,type);
	}

	/**
	 * Request a node from the Content Cloud.
	 * Trigger callback function when complete.
	 *
	 * WARNING:
	 * Make sure you're only accessing nodes which are included in this
	 * page, collection or layout.  Otherwise, this is an inefficient method
	 * of accessing data since you're hitting your Content Cloud for each
	 * payload.
	 *
	 * @param <type> $node
	 * @param <type> $dontEcho
	 * @return <type>
	 */
	CRUD.prototype.get = function(node,success,error) {
		var type,payload,crud=this;

		success = success || this.success || defaultSuccess;
		error = error || this.error || defaultError;

		if (!node) {
			throw new Error('Missing parameter "node".');
			error && error(crud.output("Unable to get from content cloud."));
		}
		else if (typeof this.cache[node] != "undefined") {
			// Check cache first
			type = this.cache[node].type;
			payload = this.cache[node].payload;
			success && success(this.output(payload,type));
		}
		else {
			// If the node isn't in the cache, request it from Content Cloud
			this.crudRequest('read',node,
				function successCallback(readObject){
					if (!readObject.success) {
						// Handle errors
						payload = readObject.error.message;
						error && error(crud.output(payload));
					}
					else {
						// Return requested node
						type = readObject.content[node].type;
						payload = readObject.content[node].payload;
						success && success(crud.output(payload,type));
					}
				},
				function errorCallback(readObject) {
					error && error(crud.output("Unable to get from content cloud."));
				});

		}
	}

	/**
	 * Called automatically during the initialization.
	 * Loads applicable nodes from the Content Cloud.
	 *
	 * @param <type> $node
	 * @param <type> $dontEcho
	 * @return <type>
	 */
	CRUD.prototype.load = function(collection,success,error) {
		collection = collection || "";
		var crud = this;

		this.crudRequest('load',collection,
			function successCallback(loadObject){
				if (!loadObject.success) {
					throw new Error(loadObject.error.message);
					error && error(crud.output(loadObject.error.message));
				}
				else {
					// Update cache with any changes/new nodes
					this.cache = _.extend(crud.cache,loadObject.content);
					success && success(crud.output(loadObject.content));
				}
			},
			function errorCallback(loadObject) {
				error && error(crud.output("Unable to load from content cloud."));
			});	
	}


	// Fluff content payload into the desired format
	CRUD.prototype.output = function (payload, type) {
		type = type || 'text';

		// TODO: handle images
		// TODO: support other types of media and other HTML <elements>
		// TODO: support data URI with BSON

		// Escape HTML inside payload if type=='text'
		payload = (type=='text') ? _.escape(payload) : payload;

		return payload;
	}

	// Perform a direct JSONP request to CRUD.io server
	CRUD.prototype.crudRequest = function (method,parameter,success,error) {
		$.ajax({
			url: this.server+"/"+method+"/"+urlEscape(parameter),
			dataType: "jsonp",
			jsonpCallback: "_crudio",
			cache: false,
			timeout: 5000,
			success: success || this.success || defaultSuccess,
			error: error || this.error || defaultError
		});
	}

	///////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	//
	///////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////

	// Construct a CRUD.io client instance
	function constructor (properties) {
		var defaults = { };
		_.defaults(this,defaults);
		_.defaults(this,properties);
		this.cache = {};
		this.load(null,this.success,this.error);
	}

	// Escape a parameter for use in the request URL
	function urlEscape (parameter) {
		// Replace spaces with dashes
		parameter = parameter.replace(" ","-");

		// Crud.io nodes are case insensitive
		parameter = parameter.toLowerCase();

		// Encode naughty characters
		return encodeURIComponent(parameter);
	}

	// Default error handling
	function defaultError(errorThrown) {
		throw new Error(errorThrown);
	}

	// Default success callback handling
	function defaultSuccess(data) {
		log("No callback handler was specified, but I'll tell you what the server said anyway:",data);
	}

})();


//////////////////////////////////////////////////
// CRUD.io jQuery Plugin
// c. Mike McNeil 2011-2012
//
//
//////////////////////////////////////////////////
//(function( $ ) {
//
//	$.crud = function (configuration) {
//		if (configuration && configuration.server) {
//			$.crud.server = configuration.server;
//		}
//		else {
//			throw new Error ('No server URL specified in configuration!');
//		}
//	}
//
//	$.fn.crud = function(nodeName) {
//		var el = $(this);
//
//		$.crud.read(nodeName,function(data){
//			el.text(data.content)
//		});
//	}
//
//})(jQuery);