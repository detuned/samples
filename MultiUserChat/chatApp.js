/**
 * Main parts of a multi-user chat functionality
 * used on a major dating site
 *
 * All is event-based, all is asynchronously.
 * Actively used deferred & promises, MVC as much as reasonable, object observing etc
 *
 * @author Maxim Smirnov <detunedtv@gmail.com>
 */


(function( global ){

	$( function(){
		$( '[role="chat"]' )
			.click( function(){
				global.ChatController.toggle();
			} );

		global.ChatController.init();
	} );

	/**
	 * Opens chat and activate user if id given
	 * Simple alias for <code>ChatController.open({id:1})</code>
	 *
	 * @example <code>openChat()</code> chat will open, previous or first user in list will be activated
	 * @example <code>openChat( 1 )</code> chat will open and user id=1 will be activated
	 * @example <code>openChat( UsersRegistry.UserModel( { id : 1 } ) )</code> the same as prev example
	 */
	global.openChat = function( user ){
		global.ChatController.open( {
			user : user
		} );
	}

})( this );
