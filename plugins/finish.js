/*global yepnope, jQuery */

yepnope(
    {
        load: [],
        complete: setup
    }
);

function setup(){
    console.log('All done?');
	$('#block_menu').accordion({ autoHeight: false,  collapsible: true });
    $('#block_menu').show();
};
