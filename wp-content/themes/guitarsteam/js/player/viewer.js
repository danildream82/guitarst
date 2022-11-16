/*
* Здесь собраны функции для работы 3D viewrа
* */

var Viewer = {

    gplayer : null,

    /*****************************************************************************************/
    GetSelectedObj : function( objects )
    {
        return $('#obj_select').val();
    },
    /*****************************************************************************************/
    MoveObject : function( obj, evt )
    {
        var posChanged = true;
        var step = 3;
        var angle_step = 0.05;
        var default_z = 200;
        var ret = false;

        var pos = obj.position;
        var rotate = obj.rotation;

        switch (evt.keyCode)
        {
            case 65: // a (left)
                pos.y += step;
                break;
            case 68: // d (right)
                pos.y -= step;
                break;
            case 87: // w (up)
                pos.x += step;
                break;
            case 83: // s (down)
                pos.x -= step;
                break;
            case 190: // >
                if ( evt.shiftKey )
                    rotate.y -= angle_step;
                else
                    rotate.z += angle_step;
                break;
            case 188: // <
                if ( evt.shiftKey )
                    rotate.y += angle_step;
                else
                    rotate.z -= angle_step;
                    break;
            case 33: // Page Up
                pos.z += step; break;
            case 34: // Page Down
                pos.z -= step; break;

            case 36: // home
                rotate.x = rotate.y = rotate.z = 0;
                pos.x = pos.y = 0; pos.z = default_z;
                break;
            default:
                posChanged = false;
        }

        if ( posChanged )
        {
            obj.position.copy( pos );
            obj.rotation.copy( rotate );
            obj.updateMatrixWorld();

            evt.preventDefault();
            this.DisplayCoords( obj );
            ret = true;
        }

        return ret;
    },
    /*****************************************************************************************/
    DisplayCoords : function( obj )
    {
        $('#coords .x').text( obj.position.x.toFixed(2) );
        $('#coords .y').text( obj.position.y.toFixed(2) );
        $('#coords .z').text( obj.position.z.toFixed(2) );
        $('#coords .rx').text(obj.rotation.x.toFixed(2) );
        $('#coords .ry').text(obj.rotation.y.toFixed(2) );
        $('#coords .rz').text(obj.rotation.z.toFixed(2) );
    },
    /*****************************************************************************************/
    SetupSelectInput : function( names )
    {
        $('#obj_select option').remove();

        for( var i in names )
            $('#obj_select').append($("<option></option>").attr( "value", names[i] ).text( names[i] ));
    }
    /*****************************************************************************************/
};

/*
 * Обработчики событий
 * */

// COORDS
$('#obj_select').change( function(){
    $('#cnvs').focus();
    Viewer.DisplayCoords( Viewer.gplayer.scene.getObjectByName( Viewer.GetSelectedObj() ));
});

var html = $('#save-coords');

$('#save-coords').on('click', function(){
    Utils.SaveCoords( "camPos", Viewer.gplayer.camera.position );
    Utils.SaveCoords( "camRotate", Viewer.gplayer.camera.rotation );

    Utils.SaveCoords( "light", Viewer.gplayer.lights[0].position );
});
/*****************************************************************************************/
$('#load-coords').on('click', function(){
    // Remove options from dropdown list
    $('#obj_select  option').remove();
    $('#obj_select').append($("<option></option>")
        .attr( "value", "camera" ).text( "Camera" ));

    Viewer.gplayer.BuildScene();
    Viewer.gplayer.Render();
});
//----------------------------------------------------------------------------------------