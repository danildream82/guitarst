
var Utils = {
    dump : function( toObj, tcSplit )
    {
        if (!tcSplit) tcSplit = '\n';
        var lcRet = '';
        var lcTab = '    ';

        for (var i in toObj) // обращение к свойствам объекта по индексу
            lcRet += lcTab + i + " : " + toObj[i] + tcSplit;

        lcRet = '{' + tcSplit + lcRet + '}';

        return lcRet;
    },
    /********************************************************************************/
    SaveCoords : function( name, point )
    {
        $.cookie( name + "X", point.x, {expires: 365 });
        $.cookie( name + "Y", point.y, {expires: 365 });
        $.cookie( name + "Z", point.z, {expires: 365 });
    },
    //----------------------------------------------------------------------------------------
    LoadCoords : function( name, point )
    {
        var x = $.cookie( name + "X" );
        var y = $.cookie( name + "Y" );
        var z = $.cookie( name + "Z" );

        point.set( +$.cookie( name + "X" ), +$.cookie( name + "Y" ), +$.cookie( name + "Z" ));
    },
    /********************************************************************************/
    cloneObject : function( obj )
    {
        if (typeof obj != "object") {
            return obj;
        }

        if ( obj )
        {
            var copy = obj.constructor();
            for (var key in obj)
            {
                if (typeof obj[key] == "object") {
                    copy[key] = this.cloneObject(obj[key]);
                } else {
                    copy[key] = obj[key];
                }
            }

            return copy;
        }

        return obj;
    },
    /********************************************************************************/
    goFullScreen : function ( obj )
    {
        if( obj.requestFullScreen )
            obj.requestFullScreen();
        else if(obj.webkitRequestFullScreen)
            obj.webkitRequestFullScreen();
        else if(obj.mozRequestFullScreen)
            obj.mozRequestFullScreen();
    },
    /********************************************************************************/
    exitFullScreen : function ()
    {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    },
    /********************************************************************************/
    isInFullScreen : function ()
    {
        return (document.fullscreenElement && document.fullscreenElement !== null) ||
        (document.webkitFullscreenElement && document.webkitFullscreenElement !== null) ||
        (document.mozFullScreenElement && document.mozFullScreenElement !== null) ||
        (document.msFullscreenElement && document.msFullscreenElement !== null);
    },
    /********************************************************************************/
    log : function ( str )
    {
        //console.log( str );
    }
    /********************************************************************************/
};