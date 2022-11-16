var PlayerDispatch = null;(function (){
// Коэффициенты расстояний каждого лада, с первого по 24-й
var frets_coefficient = [ 0, 0.0561257, 0.1091013, 0.1591036, 0.2062995, 0.2508465, 0.2928932, 0.3325801, 0.3700396, 0.4053966, 0.4387690, 0.4702684, 0.5000000,
                   0.5280628, 0.5545506, 0.5795518, 0.6031497, 0.6254232, 0.6464466, 0.6662900, 0.6850198, 0.7026983, 0.7193845, 0.73513242, 0.7500000];

var note_state = {
    preflight           : 0, // появилась на горизонте, но еще не летит
    flying              : 1, // в полете
    ringing             : 2, // звучит
    removed             : 3  // отыграла и удалена со сцены
};

var fly_strip_state = {
    growing  : 0,   // удлиняется
    flying   : 1,   // конец дорожки появилcя на экране, но она еще в полете
    fixed    : 2,   // достигла достигла ближнего грифа
    reducing : 3    // уменьшается
};

// Проигрыватель табов
function gpTabs( gpGlobal )
{
    var gplayer = this;
    gplayer.gpGlobal = gpGlobal;

    gplayer.Init = function()
    {
        return true;
    }
}

// 3D проигрыватель
function gpVisual( gpGlobal )
{
    var gplayer = this;
    gplayer.gpGlobal = gpGlobal;

    gplayer.urls = {
        neck_1 :        jsPlayerUrl + "models/neck-1.js?v=155",
        neck_2 :        jsPlayerUrl + "models/neck-2.js?v=168",
        strips :        jsPlayerUrl + "models/fret-strips/strip-",
        font_ubuntu :   jsPlayerUrl + 'models/Ubuntu_Bold.json',
        bgImage :       playerImagesUrl + "bckg.jpg"
    };

    gplayer.notes = []; // currently visible notes
    gplayer.notes_to_play = []; // ноты, которые долетели до ближнегно грифа на текущем тике

    var previous_speed = 1; // прыдущий множитель скорости из миди-плеера (для рассчета времени подлетающих нот)

    var fret_strips = [];   // массив летящих дорожек
    // содержит такую структуру:
    // mesh - исходная модель дорожки
    // dimensions - размеры модели
    // flying - массив летящих дорожек на экране: { mesh, growing } - growing = true, пока длина дорожки растет

    var current_strip_preflight = { // группа текущих дорожек при появлении нот на дальнем грифе ( ДО появления летящих нот )
        fret_min: 0,
        fret_max: 0,
        strip_max_box : null,
        strip_min_box: null,
        strip_width: 0
    };

    var current_strip_fly = { // группа текущих дорожек у дальнего грифа ( при создании летящих нот )
        fret_min: -1,
        fret_max: -1,
        strip_max_box : null,
        strip_min_box: null,
        strip_width: 0
    };

    var current_strip_play = { // группа текущих дорожек у ближнего грифа ( при звукоизвлечении )
        fret_min: -1,
        fret_max: -1,
        strip_max_box : null,
        strip_min_box: null,
        strip_width: 0
    };

    var prev_fly_strip = { // предыдущая летящая дорожка
        fret_min: -1,
        fret_max: -1
    };

    // Параметры элементов сцены
    var sceneParams = {

        open_string_coord_y : 133,      // Координата открытой струны ( за порожком ); координата по иксу совпадает с sceneParams.point_start
        string_nut_y : 127,             // Коордлината отсечения струны по верхнему порожку
        floor_z : -12,                // координата нижней плоскости сцены, в которой летят дорожки

        strings_coord_z : [ -9.5, -6, -1.9, 1.9, 6.1, 10.3 ], // Первый элемент - тонкая Ми

        // Рассчитываемые параметры
        mensura : 256.5,                // мензура нашей виртуальной гитары
        edge_fret_grid : [],            // координаты ладов по их дальней кромке
        middle_fret_grid : [],          // заранее рассчитанные координаты середины каждого лада

        point_start : 97,               // координата начала пролета нот ( по Иксу )
        point_finish : -94.3,           // координата активации но на ближнем грифе

        flight_distance : 0,            // рсстояние между грифами
        flight_time : 0,                // время пролета нот
        flight_speed : 0,               // скорость пролета нот (3D ед. / мсек)
        flight_speed_default : 0,        // нормальная скорость

        fly_strip_point_start : 0,      // координаты пролета дорожек
        fly_strip_point_finish : 0,
        fly_strip_distance : 0,         // расстояние между грифами
        fly_strip_speed : 0,            // скорость пролета дорожек

        total_distance : 0,             // расстояние между струнами - там, где активируются летящие ноты
    };

    gplayer.renderer = null;    // A three.js WebGL or Canvas renderer.
    gplayer.scene = null;       // The 3D scene that will be rendered, containing the model.
    gplayer.camera = null;      // The camera that takes the picture of the scene.
    gplayer.bgCamera = null;    // вторая камера и сцена для фона
    gplayer.bgScene = null;
    gplayer.bgMesh = null;
    gplayer.lights = [];
    gplayer.lightHelpers = [];

    // Менеджер 3D моделей
    var meshManager = new MeshManager();

    // Состояние камеры
    gplayer.camera_moving = false; // true при движении

    // координаты камеры
    gplayer.camera_data = {

        camera_fixed : false, // если true, тогда камера не двигается

        // Common
        camera_start_position   : new THREE.Vector3(-162, 82, 62),  // с нулевого по 5-й лад
        camera_end_position     : new THREE.Vector3(-273, 10, 62),  // весь гриф целиком

        coord_dispersion_x1 : 5.48, // параметры адаптивности
        coord_dispersion_y1 : 30,
        coord_dispersion_x2 : 91,
        coord_dispersion_y2 : 12,

        // Chrome
        // camera_start_position   : new THREE.Vector3(-156, 52, 62),  // с нулевого по 5-й лад
        // camera_end_position     : new THREE.Vector3(-182, 22, 62),  // весь гриф целиком

        // Nexus
        // camera_start_position   : new THREE.Vector3(-159, 49, 62),  // с нулевого по 5-й лад
        // camera_end_position     : new THREE.Vector3(-189, 16, 62),  // весь гриф целиком

        // FF
        // camera_start_position   : new THREE.Vector3(-156, 52, 62),  // с нулевого по 5-й лад
        // camera_end_position     : new THREE.Vector3(-182, 22, 62),  // весь гриф целиком

        // IPad
        // camera_start_position   : new THREE.Vector3(-159, 70, 62),  // с нулевого по 5-й лад
        // camera_end_position     : new THREE.Vector3(-222, 19, 62),  // весь гриф целиком

        // 1000
        // camera_start_position   : new THREE.Vector3(-162, 82, 62),  // с нулевого по 5-й лад
        // camera_end_position     : new THREE.Vector3(-273, 10, 62),  // весь гриф целиком

        camera_start_rotation   : new THREE.Euler(0.3, -1.1, -1.15),
        default_visible_distance : 0, // высчитывается (расстояние видимых ладов с 1 по 5-й по оси Y)
        dist_gradient_x         : 0,  // коэффициент дистанции пути камеры по X
        dist_gradient_y         : 0,   // то же самое по Y

        tween : null,   // (new TWEEN) для анимации камеры
        camera_target_position : null, // используется для рассчета конечных координат
        camera_strip_focused : { fret_min : 0, fret_max : 0 }, // текущий фокус камеры

        //-------------------------------------------------------------
        onTweenStart : function()
        {
            gplayer.camera_moving = true;
            gpGlobal.cbTickManager(); // запускаем тики глобально
        },
        //-------------------------------------------------------------
        onTweenComplete : function()
        {
            gplayer.camera_moving = false;
            gpGlobal.cbTickManager(); // останавливаем тики глобально
        }
        //-------------------------------------------------------------
    };

    gplayer.model_neck = null;              // грифы

    // Плоскости для клиппинга на грифах
    gplayer.clipping_plane_near = null;
    gplayer.clipping_plane_far = null;

    gplayer.font_ubuntu_bold = null;

    var strip_id = 1;

    var skip_frame = false; // пропуск кадра

    /*****************************************************************************************/
    // Public
    /*****************************************************************************************/
    gplayer.Init = function( onReady )
    {
        var theCanvas = document.getElementById("canvas"); // Init the scene

        gplayer.scene = new THREE.Scene();
        gplayer.camera = new THREE.PerspectiveCamera( 50, window.screen.width / window.screen.height, 1, 1000 );
        // gplayer.camera = new THREE.OrthographicCamera(theCanvas.width / -10, theCanvas.width / 10, theCanvas.height / 10, theCanvas.height / -10, 0.5, 3000);//      camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
        gplayer.camera.name = 'camera';

        gplayer.renderer = new THREE.WebGLRenderer( { canvas: theCanvas, antialias: true } );

        // считаем масштаб пикселей, чтобы не превышать реальное разрешение экрана
        var ratio = Math.floor( window.devicePixelRatio * 100 ) / 100; // округляем до двух знаков после запятой

        gplayer.renderer.setPixelRatio( ratio );
        gplayer.renderer.setSize( window.screen.width, window.screen.height );
        gplayer.renderer.setClearColor( 0x222953 );
        gplayer.renderer.localClippingEnabled = true;

        SetupLights();

        // Задний фон
        gplayer.bgCamera = new THREE.Camera();
        gplayer.bgScene = new THREE.Scene();

        // Load objects
        LoadModels( function( result )
        {
            if ( result )
                gplayer.BuildScene(); // построение всей сцены

            onReady( result );
        });
    }
    /*****************************************************************************************/
    gplayer.GetCamera = function ()
    {
        return gplayer.camera;
    }
    /*****************************************************************************************/
    gplayer.SetFlightSpeed = function( flight_time, defaul_flight_time )
    {
        // Установка скорости для нот
        sceneParams.flight_distance = sceneParams.point_start - sceneParams.point_finish;
        sceneParams.flight_time = flight_time;
        sceneParams.flight_speed = sceneParams.flight_distance / flight_time;
        sceneParams.flight_speed_default = sceneParams.flight_distance / defaul_flight_time;

        // Установка скорости для дорожек
        sceneParams.fly_strip_speed = sceneParams.fly_strip_distance / flight_time;
    }
    /*****************************************************************************************/
    gplayer.UpdateNotesPreFlightTime = function () // обновляет счетчик времени подлета отдельно у каждой ноты
    {
        var new_speed = gpGlobal.GetSpeed();

        if ( new_speed != previous_speed )
        {
            gplayer.notes.forEach( function( note, index )
            {
                if ( note.state == note_state.preflight )
                {
                    // нужно сначала вернуться к исходному масштабу, а затем применить новый
                    gplayer.notes[index].preflight_time = gplayer.notes[index].preflight_time / previous_speed;
                    gplayer.notes[index].preflight_time = gplayer.notes[index].preflight_time * new_speed;
                }
            });

            previous_speed = new_speed; // сохраняем
        }
    }
    /*****************************************************************************************/
    gplayer.HasNotes = function()
    {
        return gplayer.notes.length > 0;
    }
    /*****************************************************************************************/
    gplayer.Render = function()
    {
        gplayer.renderer.autoClear = false;
        gplayer.renderer.clear();

        gplayer.renderer.render( gplayer.bgScene, gplayer.bgCamera ); // background
        gplayer.renderer.render( gplayer.scene, gplayer.camera );
    }
    /*****************************************************************************************/
    gplayer.ClearScene = function()
    {
        // удаляем ноты
        for ( var i = 0; i < gplayer.notes.length; i++ )
        {
            var d3note = gplayer.notes[i];

            if ( d3note.group )
            {
                gplayer.scene.remove( d3note.group );
                meshManager.ReturnMesh( d3note.group );
            }
            if ( d3note.keep_flying_group )
            {
                gplayer.scene.remove( d3note.keep_flying_group );
                meshManager.ReturnMesh( d3note.keep_flying_group );
            }
        }
        gplayer.notes.length = 0;

        // удаляем дорожки
        for ( var i = 0; i < fret_strips.length; i++ )
        {
            var strip = fret_strips[i];

            if ( strip.flying )
            {
                // перебираем летящие
                for ( var j = 0; j < strip.flying.length; j++ )
                {
                    var fly_strip = strip.flying[j];
                    gplayer.scene.remove( fly_strip.mesh );
                } // for flying

                strip.flying.length = 0;
            }
        } // for strips

        ClearCurrentStripData( current_strip_preflight );
        ClearCurrentStripData( current_strip_fly );
        ClearCurrentStripData( current_strip_play );

        current_strip_preflight.fret_min = 0;
        current_strip_preflight.fret_max = 0;
    }
    /*****************************************************************************************/
    gplayer.BuildScene = function()
    {
        var pos;
        var rotate;

        gplayer.ClearScene();

        InitCameraData();

        // Setup Camera
        gplayer.camera.position.copy( pos );
        gplayer.camera.rotation.copy( rotate );

        gplayer.camera_data.tween = new TWEEN.Tween( gplayer.camera.position );
        gplayer.camera_data.tween.onComplete( gplayer.camera_data.onTweenComplete );

        // Грифы
        gplayer.scene.add( gplayer.model_neck );

        // Добавляем и расставляем ладовые дорожки, а также номера ладов
        var num_geometry = new THREE.Geometry();

        for (var i = 0; i < fret_strips.length; i++)
        {
            var strip = fret_strips[i];
            strip.mesh.name = 'strip-' + i;

            strip.flying = [];

            // смещаем дорожку в нулевую точку пути
            strip.mesh.position.x += strip.dimensions.x / 2;

            // Номер лада
            var geometry = new THREE.TextGeometry( i + 1, {
                font: gplayer.font_ubuntu_bold,
                size: 3,
                height: 0,
                curveSegments: 0
            });

            geometry.center();
            geometry.rotateZ( Math.PI / 2 * (-1));
            geometry.rotateY( Math.PI / 2 * (-1));

            geometry.translate( sceneParams.point_finish - 2,
                                sceneParams.middle_fret_grid[ i ], // Выравнивание по центру лада
                                sceneParams.edge_fret_grid[ i ].min.z - 3 );

            num_geometry.merge( geometry );
        }

        // номера ладов
        num_geometry = new THREE.BufferGeometry().fromGeometry( num_geometry ); // convert
        var numbers_mesh = new THREE.Mesh( num_geometry, new THREE.MeshBasicMaterial({color: new THREE.Color( 0x888888 )}));

        gplayer.scene.add( numbers_mesh );

        sceneParams.fly_strip_point_start = fret_strips[0].mesh.position.x;
        sceneParams.fly_strip_point_finish = fret_strips[0].mesh.position.x - fret_strips[0].dimensions.x;
        sceneParams.fly_strip_distance = fret_strips[0].dimensions.x;

        // Плоскости для клиппинга
        gplayer.clipping_plane_far  = new THREE.Plane( new THREE.Vector3( -1, 0, 0 ), ( sceneParams.fly_strip_point_start - sceneParams.fly_strip_point_finish ) / 2 );
        gplayer.clipping_plane_near = new THREE.Plane( new THREE.Vector3(  1, 0, 0 ), ( sceneParams.fly_strip_point_start - sceneParams.fly_strip_point_finish ) / 2 );

        // Устанавливаем фон
        gplayer.bgScene.add( gplayer.bgMesh );

        // Init mesh pool
        meshManager.Init();

        gplayer.Render();

        function InitCameraData()
        {
            FitCameraPosToScreen();

            pos = gplayer.camera_data.camera_start_position;
            rotate = gplayer.camera_data.camera_start_rotation;

            // параметры камеры
            gplayer.camera_data.default_visible_distance = sceneParams.edge_fret_grid[ 0 ].max.y - sceneParams.edge_fret_grid[ 4 ].min.y; // c 1-го по 5-й лад

            var camera_min_x = gplayer.camera_data.camera_start_position.x;
            var camera_max_x = gplayer.camera_data.camera_end_position.x;
            var camera_min_y = gplayer.camera_data.camera_start_position.y;
            var camera_max_y = gplayer.camera_data.camera_end_position.y;

            var camera_max_delta_x = Math.abs( camera_max_x - camera_min_x );
            var camera_max_delta_y = Math.abs( camera_max_y - camera_min_y );

            var fret_distance_total = sceneParams.edge_fret_grid[ 0 ].max.y - sceneParams.edge_fret_grid[ 18 ].min.y; // координата x не меняется

            gplayer.camera_data.dist_gradient_x = camera_max_delta_x / ( fret_distance_total - gplayer.camera_data.default_visible_distance );
            gplayer.camera_data.dist_gradient_y = camera_max_delta_y / ( fret_distance_total - gplayer.camera_data.default_visible_distance );

            gplayer.camera_data.camera_target_position = new THREE.Vector3().copy( gplayer.camera_data.camera_start_position );
        }

        function FitCameraPosToScreen()
        {
            // Рассчитываем позицию камеры
            var total_delta_ratio = 0.778; // нормативное соотношение сторон - 16 : 9

            // соотношение сторон данного экрана минус 1
            var container = document.getElementById("player_container");
            var delta_screen_ratio = container.offsetWidth / container.offsetHeight - 1;

            // уточняющий коэффициент (за счет кривизны камеры, зависимость немного более сложная)
            var k = 1.778 / ( container.offsetWidth / container.offsetHeight ); // на большом экране он равен 1

            var coord_dispersion_x1 = gplayer.camera_data.coord_dispersion_x1;
            var coord_dispersion_y1 = gplayer.camera_data.coord_dispersion_y1;

            var coord_dispersion_x2 = gplayer.camera_data.coord_dispersion_x2 * k;
            var coord_dispersion_y2 = gplayer.camera_data.coord_dispersion_y2 * k;

            gplayer.camera_data.camera_start_position.x += delta_screen_ratio * coord_dispersion_x1 / total_delta_ratio;
            gplayer.camera_data.camera_start_position.y -= delta_screen_ratio * coord_dispersion_y1 / total_delta_ratio;

            gplayer.camera_data.camera_end_position.x += delta_screen_ratio * coord_dispersion_x2 / total_delta_ratio;
            gplayer.camera_data.camera_end_position.y += delta_screen_ratio * coord_dispersion_y2 / total_delta_ratio;
        }
    }
    /*****************************************************************************************/
    gplayer.Tick = function( current_tick_size, playing )
    {
        var ret = [];

        Utils.log('*********************************************  Tick  *************************************************');

        TWEEN.update();

        if ( playing )
        {
            // Передвижение объектов
            var i = 0;
            for ( i = 0; i < gplayer.notes.length; i++ )
            {
                var d3note = gplayer.notes[i];

                // Передвижение ноты
                if ( d3note.state == note_state.preflight )
                    PreFlightNote( d3note, current_tick_size );
                else
                if ( d3note.state == note_state.flying ) // FLYING
                    FlyNote( d3note, current_tick_size );
                else
                // Анимация звукоизвлечения
                if ( d3note.state == note_state.ringing ) // RINGING
                    RingNote( d3note, current_tick_size );

                // Если нота отыграла
                if ( d3note.state == note_state.removed )
                {
                    gplayer.notes.splice( i, 1 ); // удаляем из массива
                    i--;
                }
            } // for

            FlyAllStrips( current_tick_size );

            ret = gplayer.notes_to_play.length;
        }

        // пропуск каждого второго кадра
        if ( skip_frame )
            skip_frame = false;
        else
        {
            gplayer.Render();
            skip_frame = true;
        }

        return ret;
    }
    /*****************************************************************************************/
    gplayer.AddNote = function( beat, time_shift ) // time_shift
    {
        // Создаем объект
        var d3note = {
            beat : beat, // миди-нота
            group : meshManager.GetGroup(), // объект, содержащий модели всех нот в бите
            keep_flying_group : null,       // используется для движущихся частей ноты после ее звукоизвлечения (slide, bend и т.п.)
            state : note_state.preflight,
            preflight_time : 0
        };

        d3note.group.position.x = sceneParams.point_start; // выставляем в начало пути

        CreateNotePreflight( d3note );

        gplayer.notes.push( d3note ); // сохраняем

        PreFlightNote( d3note, time_shift ); // задаем прозрачность
    }
    /*****************************************************************************************/
    // Private
    /*****************************************************************************************/
    function SetCameraPosition( position, left_fret, right_fret )
    {
        // выставление случайного ракурса
        var left_fret_y = sceneParams.edge_fret_grid[ left_fret ].max.y;
        var right_fret_y = sceneParams.edge_fret_grid[ right_fret ].min.y;

        // невидимое расстояние, которое нужно открыть
        var hidden_distance = left_fret_y - right_fret_y - gplayer.camera_data.default_visible_distance;

        // Выставление камеры по левому краю
        position.y -= sceneParams.edge_fret_grid[ 0 ].max.y - sceneParams.edge_fret_grid[ left_fret ].max.y;

        // если правый лад не видно
        if ( hidden_distance > 0 )
        {
            // разницу между текущей и искомой нижней точкой нужно привести к координатам камеры
            var camera_delta_x = hidden_distance * gplayer.camera_data.dist_gradient_x;
            var camera_delta_y = hidden_distance * gplayer.camera_data.dist_gradient_y;

            // отодвигаем камеру назад и вправо
            position.x -= camera_delta_x;
            position.y -= camera_delta_y;
        }
    }
    /*****************************************************************************************/
    function MoveCamera()
    {
        if ( gplayer.camera_data.camera_fixed )
            return;

        var min_fret = -1;
        var max_fret = -1;

        // Определяем ширину всех дорожек в полете
        for ( var i = 0; i < fret_strips.length; i++ ) // минимальный лад
        {
            if ( fret_strips[i].flying.length > 0)
            {
                min_fret = i;
                break;
            }
        }
        for ( var i = fret_strips.length - 1; i >= 0; i-- ) // максимальный лад ищем в обратном порядке
        {
            if ( fret_strips[i].flying.length > 0 )
            {
                max_fret = i;
                break;
            }
        }

        // если летящих дорожек не оказалось, тогда берем крайние лады по двум другим состояниям
        if ( min_fret == -1 )
            min_fret = 18;
        if ( max_fret == -1 )
            max_fret = 0;

        // определяем минимальный лад среди всех трех состояний дорожек
        if ( current_strip_preflight.fret_min < min_fret && current_strip_preflight.fret_min >= 0 )
            min_fret = current_strip_preflight.fret_min;
        else
        if ( current_strip_play.fret_min < min_fret && current_strip_play.fret_min >= 0 )
            min_fret = current_strip_play.fret_min;

        // определяем максимальный лад среди всех трех состояний дорожек
        if ( current_strip_preflight.fret_max > max_fret && current_strip_preflight.fret_max >= 0 )
            max_fret = current_strip_preflight.fret_max;
        else
        if ( current_strip_play.fret_max > max_fret && current_strip_play.fret_max >= 0 )
            max_fret = current_strip_play.fret_max;

        // если нужно сменить фокус
        if ( min_fret != gplayer.camera_data.camera_strip_focused.fret_min || max_fret != gplayer.camera_data.camera_strip_focused.fret_max )
        {
            gplayer.camera_data.camera_strip_focused.fret_min = min_fret;
            gplayer.camera_data.camera_strip_focused.fret_max = max_fret;

            // Анимация камеры
            SetCameraPosition( gplayer.camera_data.camera_target_position,
                gplayer.camera_data.camera_strip_focused.fret_min,
                gplayer.camera_data.camera_strip_focused.fret_max );

            gplayer.camera_data.tween.to({ x: gplayer.camera_data.camera_target_position.x,
                                           y: gplayer.camera_data.camera_target_position.y },
                                           gpGlobal.preflight_time );

            gplayer.camera_data.camera_target_position.copy( gplayer.camera_data.camera_start_position ); // ресет для след. позиции
            gplayer.camera_data.tween.start();

            // Запуск тиков
            gplayer.camera_data.onTweenStart();
        }
        /*---------------------------------------------------------------------------------------*/
    }
    /*****************************************************************************************/
    function LoadModels( onReady )
    {
        // Грифы
        LoadResource( gplayer.urls.neck_1, new THREE.JSONLoader(), function ( geometry, materials )
        {
            // geometry = new THREE.BufferGeometry().fromGeometry( geometry ); // convert
            var geometry_1 =  geometry;
            var materials_1 = materials;

            // load progress
            gpGlobal.cbLoadProgress( player_load_progress.neck_1, 'neck 1' );

            LoadResource( gplayer.urls.neck_2, new THREE.JSONLoader(), function ( geometry, materials )
            {
                var geometry_2 = geometry;
                var materials_2 = materials;

                var neck_geometry = new THREE.Geometry();

                neck_geometry.merge( geometry_1, undefined, 0 );
                neck_geometry.merge( geometry_2, undefined, 9 ); // со смещение индекса материала

                // Прозрачный материал
                for ( var i = 0; i < materials_1.length; i++ )
                {
                    materials_1[i].transparent = true;
                    materials_1[i].opacity = 0.25;
                }

                // сливаем массивы с материалами
                for ( var i = 0; i < materials_2.length; i++ )
                    materials_1.push( materials_2[i] );

                // конвертируем
                neck_geometry = new THREE.BufferGeometry().fromGeometry( neck_geometry );

                // создаем mesh
                gplayer.model_neck = InitModel( neck_geometry, materials_1, 1 );

                // load progress
                gpGlobal.cbLoadProgress( player_load_progress.neck_2, 'neck 2' );

                // LOAD FONT
                LoadResource( gplayer.urls.font_ubuntu, new THREE.FontLoader(), function ( font )
                {
                    gplayer.font_ubuntu_bold = font;

                    // load progress
                    gpGlobal.cbLoadProgress( player_load_progress.font, 'font' );

                    // Дорожки
                    LoadStrips( 1 );
                });
            });
        });

        // Ладовые дорожки
        function LoadStrips( fret )
        {
            LoadResource( gplayer.urls.strips + fret + ".js?3", new THREE.JSONLoader(), function (geometry, materials)
            {
                // смещаем pivot в ближний край
                var dimensions = meshManager.GetGeometryDimensions( geometry );
                meshManager.MoveVertices( geometry.vertices, dimensions.x / 2, 0, 0 );

                geometry = new THREE.BufferGeometry().fromGeometry( geometry ); // convert

                // Задаем цвет модели
                var dark_strips  = [ 1, 3, 5, 7, 9, 12, 14, 16, 18 ];
                var color = 0x246c99; // светлая полоска

                if ( dark_strips.indexOf( fret ) != -1 )
                    color = 0x1d5b80; // темная полоска

                materials = [ new THREE.MeshBasicMaterial ({ color: new THREE.Color( color )}) ];

                var strip_mesh = InitModel( geometry, materials );
                var fret_strip = { mesh : strip_mesh, // здесь будут конкретные объекты, которые мы будем двигать по экрану
                                   dimensions : dimensions };

                strip_mesh.updateMatrixWorld();
                strip_mesh.updateMatrix();

                strip_mesh.geometry.computeBoundingBox();
                var box = strip_mesh.geometry.boundingBox.clone();

                fret_strips.push( fret_strip );
                sceneParams.edge_fret_grid.push( box );
                sceneParams.middle_fret_grid.push( box.min.y + (box.max.y - box.min.y) / 2 ); // середина лада

                if ( fret < 19 )
                    LoadStrips( fret + 1 );
                else
                {
                    // load progress
                    gpGlobal.cbLoadProgress( player_load_progress.fly_strips, 'strips' );

                    LoadBackgroundImg();
                }
            });
        }

        // Фоновый рисунок
        function LoadBackgroundImg()
        {
            // Загрузка текстуры и настройка фона

            LoadResource( gplayer.urls.bgImage, new THREE.TextureLoader(),
                function ( texture ) // on success
                {
                    // load progress
                    gpGlobal.cbLoadProgress( player_load_progress.bckg_img, 'bckg img' );

                    // Создание фоновой плоскости
                    gplayer.bgMesh = new THREE.Mesh(
                        new THREE.PlaneGeometry(2, 2, 0),
                        new THREE.MeshBasicMaterial({
                            map: texture
                        }));

                    gplayer.bgMesh.material.depthTest = false;
                    gplayer.bgMesh.material.depthWrite = false;

                    onReady( true );
                }
            );
        }

        function LoadResource( url, loader, onSuccess )
        {
            loader.load(
                url,
                onSuccess,
                function ( xhr ) //  on PROGRESS
                {
                    var total = xhr.total;
                    var loaded = xhr.loaded;
                },
                function ( err ) // on ERROR
                {
                    onReady( false );
                }
            );
        }
    }
    /*****************************************************************************************/
    function SetupLights()
    {
        // Ambient
        gplayer.scene.add( new THREE.AmbientLight( 0xffffff, 1 ));

        // A light shining from the direction of the camera.
        AddDirectionalLight( new THREE.Vector3( 0, 0, 200 ), null, 0xffffff, 1, 'light 1' );
        AddDirectionalLight( new THREE.Vector3( -80, -30, 40 ), null, 0xffffff, 1, 'light 2' );

        // SPOT LIGHT
        var spotLight = new THREE.SpotLight( 0xffffff );

        spotLight.position.set( -15, 55, 80 );
        spotLight.target.position.set( -15, sceneParams.string_nut_y, -20 );

        spotLight.name = 'spotlight';

        spotLight.target.updateMatrixWorld();

        spotLight.angle = Math.PI/10;

        var spotLightHelper = new THREE.SpotLightHelper( spotLight );

        //gplayer.scene.add( spotLight.target );
        //gplayer.scene.add( spotLightHelper );
        //gplayer.scene.add( spotLight );
    }
    /*****************************************************************************************/
    function AddDirectionalLight( pos, target, color, intensity, name )
    {
        var light = new THREE.DirectionalLight( color, intensity );

        light.position.copy( pos );

        if ( target ){
            light.target = target;
            light.target.updateMatrixWorld();
            gplayer.scene.add( light.target );
        }

        light.updateMatrixWorld();

        light.name = name;

        var helper = new THREE.DirectionalLightHelper( light, 10 );

        // Сoхраняем в массив
        gplayer.lights.push( light );
        //gplayer.lightHelpers.push( helper );

        gplayer.scene.add( light );
        //gplayer.scene.add( helper );
    }
    /*****************************************************************************************/
    // Handle loaded model
    function InitModel( geometry, materials, opacity, force_centering )
    {
        force_centering = force_centering || false;

        // задаем прозрачность
        if ( opacity < 1 )
        {
            for ( var i = 0; i < materials.length; i++ )
            {
                materials[i].transparent = true;
                materials[i].opacity = opacity;
            }
        }

        // create the object
        var object = new THREE.Mesh( geometry, materials ); /* Determine the ranges of x, y, and z in the vertices of the geometry. */

        if ( force_centering )
            CenterMesh( object );

        //object.matrixAutoUpdate = false; // надо разобраться с этим полем - оно обещает снизить нагрузку на процессор

        return object;
    }
    /*****************************************************************************************/
    function SetCurrentFlyStrip( strip_data )
    {
        // предыдущая дорожка
        if ( current_strip_fly.fret_min != -1 )
        {
            prev_fly_strip.fret_min = current_strip_fly.fret_min;
            prev_fly_strip.fret_max = current_strip_fly.fret_max;
        }

        // новая дорожка
        SetCurrentStripData( strip_data, current_strip_fly );
    }
    /*****************************************************************************************/
    function SetCurrentStripData( strip_data, current_strip )
    {
        current_strip.fret_min = strip_data.fret_min;
        current_strip.fret_max = strip_data.fret_max;

        // Bound Box крайних ладов
        current_strip.strip_max_box = sceneParams.edge_fret_grid[ strip_data.fret_max ];
        current_strip.strip_min_box = sceneParams.edge_fret_grid[ strip_data.fret_min ];

        // определяем ширину дорожки
        current_strip.strip_width = current_strip.strip_min_box.max.y - current_strip.strip_max_box.min.y;
    }
    /*****************************************************************************************/
    function ClearCurrentStripData( current_strip )
    {
        current_strip.fret_min = -1;
        current_strip.fret_max = -1;

        // Bound Box крайних ладов
        current_strip.strip_max_box = null;
        current_strip.strip_min_box = null;

        // определяем ширину дорожки
        current_strip.strip_width = 0;

        prev_fly_strip.fret_min = -1;
        prev_fly_strip.fret_max = -1;
    }
    /*****************************************************************************************/
    function CreateNotePreflight( d3note )
    {
        // если это метроном
        if ( typeof d3note.beat.meter != 'undefined' )
            return;

        // новая текущая дорожка
        if ( d3note.beat.local_data.strip_start.active )
        {
            SetCurrentStripData( d3note.beat.local_data.strip_start, current_strip_preflight );
            MoveCamera();
        }

        // перебираем голоса
        for ( var i = 0; i < d3note.beat.voices.length; i++ )
        {
            var voice = d3note.beat.voices[i];

            // перебираем ноты в бите
            for ( var j = 0; j < voice.notes.length; j++ )
            {
                var note = voice.notes[j];

                // если нота видимая
                if ( note.local_data.visible )
                {
                    note.local_data.mesh = meshManager.GetStaticNote( note, 0 );
                    d3note.group.add( note.local_data.mesh );
                } // видимая нота
            } // for notes
        } // for voices

        gplayer.scene.add( d3note.group );

        return;
    }
    /*****************************************************************************************/
    function PreFlightNote( d3note, current_tick_size ) // вид ноты перед полетом
    {
        current_tick_size = current_tick_size || 0;

        d3note.preflight_time += current_tick_size;

        if ( typeof d3note.beat.meter == 'undefined' )
        {
            // перебираем голоса
            for ( var i = 0; i < d3note.beat.voices.length; i++ )
            {
                var voice = d3note.beat.voices[i];

                // перебираем ноты в бите
                for ( var j = 0; j < voice.notes.length; j++ )
                {
                    var note = voice.notes[j];

                    // если нота видимая
                    if ( note.local_data.visible )
                    {
                        // Рассчет прозрачности ноты
                        note.local_data.mesh.material.opacity = d3note.preflight_time / ( gpGlobal.GetPreFlightTime());
                        note.local_data.mesh.material.opacity = note.local_data.mesh.material.opacity < 1 ? note.local_data.mesh.material.opacity : 1;
                    }
                } // for notes
            }
        }

        // если настало время для полета :)
        if ( d3note.preflight_time >= gpGlobal.GetPreFlightTime() )
            CreateFlyingNote( d3note, d3note.preflight_time - gpGlobal.GetPreFlightTime()); // создаем новый mesh
    }
    /*****************************************************************************************/
    function CreateFlyingNote( d3note, time_shift )
    {
        // Удаляем предыдущие объекты
        gplayer.scene.remove( d3note.group );

        meshManager.ReturnMesh( d3note.group );
        d3note.group = meshManager.GetGroup();

        // Создаем дорожку
        var is_new_strip = CreateFlyStrip( d3note, time_shift );

        var notes_visible = 0;

        // метроном
        if ( typeof d3note.beat.meter != 'undefined' )
        {
            var mesh = meshManager.CreateMeterMark();
            d3note.group.add( mesh );
        }

        // перебираем голоса
        for ( var i = 0; i < d3note.beat.voices.length; i++ )
        {
            var voice = d3note.beat.voices[i];
            var duration_msec = voice.duration.backbeats * d3note.beat.backbeat_size;

            // перебираем ноты в бите
            for ( var j = 0; j < voice.notes.length; j++ )
            {
                var note = voice.notes[j];

                // if note is visible
                if ( note.local_data.visible )
                {
                    notes_visible++;

                    // Создаем ноту
                    d3note.group.add( meshManager.GetFlyingNote( note, duration_msec ));
                } // if note visible
            } // for notes
        } // for voices

        // начало такта
        if ( d3note.beat.first_beat )
        {
            var mesh = meshManager.CreateNoteCrossMarking( true );
            d3note.group.add( mesh );
        }
        else
        {
            // Поперечная полоска
            if ( notes_visible )
            {
                var mesh = meshManager.CreateNoteCrossMarking();
                d3note.group.add( mesh );
            }
        }

        // Начало новой дорожки
        if ( is_new_strip )
        {
            meshManager.CreateStripFretNumbers( d3note.group );
            MoveCamera();
        } // new strip

        d3note.state = note_state.flying;
        gplayer.scene.add( d3note.group );

        FlyNote( d3note, time_shift );
    }
    /*****************************************************************************************/
    function CreateFlyStrip( d3note, time_shift ) // strip_data выставляется в миди-плеере
    {
        var ret = false;
        var strip_data = null;

        if ( d3note.beat.local_data && d3note.beat.local_data.strip_start.active )
        {
            strip_data = d3note.beat.local_data.strip_start;
            d3note.beat.local_data.strip_start.active = false;
            ret = true;
        }

        if ( strip_data ) // если это начало новой дорожки
        {
            Utils.log( 'START STRIP: ' + strip_data.fret_min + ' - ' + strip_data.fret_max );

            SetCurrentFlyStrip( strip_data );

            // перебираем активные лады
            for ( var i = strip_data.fret_min; i <= strip_data.fret_max; i++ )
            {
                var fly_strip = meshManager.GetFlyingStrip( i );

                Utils.log( 'Strip ' + fly_strip.ID + ': CREATED;  fret = ' + fly_strip.fret );

                gplayer.scene.add( fly_strip.mesh );

                FlyStrip( fly_strip, time_shift );
            } // for frets
        }

        return ret;
    }
    /*****************************************************************************************/
    function FlyNote( d3note, current_tick_size )
    {
        // Рассчет дистанции пролета
        var distance = current_tick_size * sceneParams.flight_speed;

        d3note.group.position.x -= distance;

        EndFlyStrip( d3note );

        if ( d3note.group.position.x <= sceneParams.point_finish ) // если нота долетела до ближнего грифа
        {
            d3note.group.position.x = sceneParams.point_finish; // ставим ноту в плоскость грифа

            // считать прошедшее время нет смысла, потому что миди звук будет сыгран только в тещуй момент
            CreateRingingNote( d3note );
        }
    }
    /*****************************************************************************************/
    function EndFlyStrip( d3note )
    {
        var strip_data = null;
        if ( d3note.beat.local_data && d3note.beat.local_data.strip_end.active )
            strip_data = d3note.beat.local_data.strip_end;

        if ( strip_data ) // конец дорожки
        {
            // рассчитываем длину звучания ноты
            var distance = d3note.beat.duration_to_next * d3note.beat.backbeat_size * sceneParams.fly_strip_speed * gpGlobal.GetSpeed();

            // если дорожка уже не достает до стартовой позиции
            if ( d3note.group.position.x + distance < sceneParams.point_start )
            {
                // перебираем летящие дорожки на указанных ладах
                for ( var i = strip_data.fret_min; i <= strip_data.fret_max; i++ )
                {
                    // берем первую РАСТУЩУЮ или ФИКСИРОВАННУЮ дорожку в списке
                    var fly_strip = null;
                    for ( var j = 0; j < fret_strips[i].flying.length; j++ )
                    {
                        fly_strip = fret_strips[i].flying[j];

                        if (( fly_strip.state == fly_strip_state.growing || fly_strip.state == fly_strip_state.fixed ) && typeof fly_strip.end_note == 'undefined' )
                            break;
                    }

                    fly_strip.end_note = d3note;
                    Utils.log('END POINT   ' + strip_data.fret_min + ' - ' + strip_data.fret_max + ';   end_note = ' + fly_strip.end_note );
                } // for

                d3note.beat.local_data.strip_end.active = false;
            }
        }
    }
    /*****************************************************************************************/
    function FlyAllStrips( current_tick_size ) // вызывается один раз за один тик
    {
        Utils.log('=======');
        // перебираем все лады грифа
        fret_strips.forEach( function( strip, fret )
        {
            for ( var i = strip.flying.length - 1; i >= 0; i-- )
            {
                var fly_strip = strip.flying[i];

                if ( fly_strip.moved == false )
                    FlyStrip( fly_strip, current_tick_size );

                fly_strip.moved = false;
            } // for each flying strip
        }); // for each fret_strips
        Utils.log(('+++++++'));
    }
    /*****************************************************************************************/
    function FlyStrip( fly_strip, current_tick_size )
    {
        // Рассчет дистанции пролета
        var distance = current_tick_size * sceneParams.fly_strip_speed;

        // Смещение дорожки
        if ( fly_strip.mesh.position.x > sceneParams.fly_strip_point_finish )
        {
            // достигает ближнего грифа
            if ( fly_strip.mesh.position.x - sceneParams.fly_strip_point_finish <= distance )
            {
                fly_strip.mesh.position.x = sceneParams.fly_strip_point_finish; // фиксируем на грифе

                // новое состояние дорожки
                if ( fly_strip.state == fly_strip_state.growing )
                {
                    Utils.log('Strip ' + fly_strip.ID + ': switched to FIXED   fret = ' + fly_strip.fret );
                    fly_strip.state = fly_strip_state.fixed;
                }
                else
                if ( fly_strip.state == fly_strip_state.flying )
                {
                    Utils.log('Strip ' + fly_strip.ID + ': switched to REDUCING   fret = ' + fly_strip.fret );
                    fly_strip.state = fly_strip_state.reducing;
                }
            }
            else
                fly_strip.mesh.position.x -= distance; // смещаем дорожку
        }

        // удлиненяем
        if ( fly_strip.state == fly_strip_state.growing )
        {
            var new_len = sceneParams.fly_strip_point_start - fly_strip.mesh.position.x; // до стартовой позиции

            if ( fly_strip.end_note )
            {
                var beat = fly_strip.end_note.beat;
                var duration = beat.duration_to_next * fly_strip.end_note.beat.backbeat_size;

                var end_point = fly_strip.end_note.group.position.x + duration * sceneParams.fly_strip_speed * gpGlobal.GetSpeed();
                new_len = end_point - fly_strip.mesh.position.x;
                fly_strip.end_note = null;
                fly_strip.state = fly_strip_state.flying;
            }

            // растягиваем ( смещение уже произошло раньше )
            meshManager.ScaleToSizeX( fly_strip.mesh, fret_strips[fly_strip.fret].dimensions.x, new_len );
            fly_strip.dimensions.x = new_len;

            Utils.log( 'Strip ' + fly_strip.ID + ': GROW ' + fly_strip.dimensions.x.toFixed(5) + ' distance = ' + distance + ';  pos = ' + fly_strip.mesh.position.x + ';   fret = ' + fly_strip.fret );
        }
        else
        if ( fly_strip.state == fly_strip_state.fixed ) // на всю длину и не меняется
        {
            if ( fly_strip.end_note )
            {
                var beat = fly_strip.end_note.beat;
                var duration = beat.duration_to_next * fly_strip.end_note.beat.backbeat_size;

                // FOR TEST
                if ( fly_strip.end_note.group == null ) // здесь бывает заваливается
                {
                    
                }

                var end_point = fly_strip.end_note.group.position.x + duration * sceneParams.fly_strip_speed * gpGlobal.GetSpeed();
                new_len = end_point - fly_strip.mesh.position.x;

                meshManager.ScaleToSizeX( fly_strip.mesh, fret_strips[fly_strip.fret].dimensions.x, new_len );
                fly_strip.dimensions.x = new_len;

                fly_strip.state = fly_strip_state.reducing;

                Utils.log('Strip ' + fly_strip.ID + ': switched to REDUCING 2   fret = ' + fly_strip.fret );

                fly_strip.end_note = null;
            }
        }
        else
        if ( fly_strip.state == fly_strip_state.reducing ) // укорачиваем
        {

            fly_strip.dimensions.x -= distance;

            // удаляем дорожку
            if ( fly_strip.dimensions.x <= 0 )
            {
                Utils.log('Strip ' + fly_strip.ID + ': DELETE   fret = ' + fly_strip.fret );

                gplayer.scene.remove( fly_strip.mesh );
                var strip = fret_strips[fly_strip.fret].flying.shift();

                meshManager.ReturnMesh( strip );
            }
            else
            {
                meshManager.ScaleToSizeX( fly_strip.mesh, fret_strips[fly_strip.fret].dimensions.x, fly_strip.dimensions.x );
                Utils.log( 'Strip ' + fly_strip.ID + ': REDUCE ' + fly_strip.dimensions.x.toFixed(5) + ';  tick = ' + current_tick_size + ';   fret = ' + fly_strip.fret );
            }
        }

        fly_strip.moved = true;
    }
    /*****************************************************************************************/
    // Момент звукоизвлечения - меняем анимацию ноты
    function CreateRingingNote( d3note )
    {
        gplayer.scene.remove( d3note.group );

        // Разбираем летящую модель
        d3note.keep_flying_group = meshManager.GetGroup(); // элементы конструкции, которые будут продолжать движение за грифом
        meshManager.ReturnMesh( d3note.group, [ 'SLIDE' ], d3note.keep_flying_group ); // Возвращаем модели в пул
        d3note.group = meshManager.GetGroup(); // создаем новую группу

        // метроном
        if ( typeof d3note.beat.meter != 'undefined' )
        {
            gplayer.notes_to_play.push( d3note.beat ); // отправка в буфер для воспроивзедения
            RemoveNote( d3note );
            return;
        }

        // Определяем дорожку
        if ( d3note.beat.local_data && d3note.beat.local_data.strip_start.in_flight )
        {
            var strip_data = d3note.beat.local_data.strip_start;
            strip_data.in_flight = false;

            SetCurrentStripData( strip_data, current_strip_play );

            MoveCamera();
        }

        var notes_ringing = 0;

        // Перебираем голоса
        for ( var i = 0; i < d3note.beat.voices.length; i++ )
        {
            var voice = d3note.beat.voices[i];

            // Перебираем ноты
            for ( var j = 0; j < voice.notes.length; j++ )
            {
                var note = voice.notes[j];

                // Если нота видимая
                if ( note.local_data.visible )
                {
                    notes_ringing++;

                    note.local_data.mesh = meshManager.GetStaticNote( note, 1, true );
                    note.local_data.sound_time = 0; // аккумулятор времени звучания ноты

                    // Если это слайд
                    if ( note.effect.slide )
                        note.effect.slide.current_fret = note.value;

                    d3note.group.add( note.local_data.mesh );
                } // if visible
            } // for notes
        }

        if ( notes_ringing )
        {
            gplayer.notes_to_play.push( d3note.beat ); // отправка в буфер для воспроивзедения
            gplayer.scene.add( d3note.group );

            // движущиеся элементы
            if ( d3note.keep_flying_group.children.length > 0 )
            {
                d3note.keep_flying_group.position.x = sceneParams.point_finish;
                gplayer.scene.add( d3note.keep_flying_group );
            }
        }

        d3note.state = note_state.ringing;
        RingNote( d3note, 0 );
    }
    /*****************************************************************************************/
    // Анимация звучащей ноты ( вызывается многократно пока нота затухает )
    function RingNote( d3note, current_tick_size )
    {
        current_tick_size = current_tick_size || 0;
        var notes_ringing = 0;

        // Перебираем голоса
        for ( var i = 0; i < d3note.beat.voices.length; i++ )
        {
            var voice = d3note.beat.voices[i];

            // Перебираем ноты
            for ( var j = 0; j < voice.notes.length; j++ )
            {
                var note = voice.notes[j];

                if ( note.local_data.mesh )
                {
                    notes_ringing++;

                    note.local_data.sound_time += current_tick_size;

                    // Рассчет прозрачности ноты
                    note.local_data.mesh.material.opacity = 1 - note.local_data.sound_time / ( note.duration_msec * gpGlobal.GetSpeed());
                    note.local_data.mesh.material.opacity = note.local_data.mesh.material.opacity > 0 ? note.local_data.mesh.material.opacity : 0;

                    // Движение ноты
                    if ( note.effect.slide && note.duration_msec ) // слайд
                    {
                        var duration = note.duration_msec * gpGlobal.GetSpeed();

                        var distance = sceneParams.middle_fret_grid[ note.value - 1 ] - sceneParams.middle_fret_grid[ note.effect.slide.next_fret - 1 ];
                        var speed = distance / duration;

                        var delta = current_tick_size * speed;

                        note.local_data.mesh.position.y -= delta;

                        // Если произошел переход на след. лад
                        if ( note.local_data.mesh.position.y <= sceneParams.middle_fret_grid[ note.effect.slide.current_fret ] )
                        {
                            note.effect.slide.current_fret++;

                            // Воспроизведение звука
                            gpGlobal.sound_system.PlaySlideNote( note, d3note.beat, voice, gpGlobal.GetSpeed());
                        }
                    }

                    // Если вся нота сыграла
                    if ( note.local_data.sound_time >= note.duration_msec * gpGlobal.GetSpeed() )
                    {
                        // Снятие ноты
                        gplayer.scene.remove( note.local_data.mesh );
                        note.local_data.mesh = null;
                    }
                }
            }
        }

        // Перемещаем подвижные элементы
        if ( d3note.keep_flying_group )
        {
            var distance = current_tick_size * sceneParams.flight_speed; // Рассчет дистанции пролета
            d3note.keep_flying_group.position.x -= distance;
        }

        if ( notes_ringing == 0 )
            RemoveNote( d3note );
    }
    /*****************************************************************************************/
    function RemoveNote( d3note )
    {
        gplayer.scene.remove( d3note.group );
        gplayer.scene.remove( d3note.keep_flying_group );
        meshManager.ReturnMesh( d3note.group );
        meshManager.ReturnMesh( d3note.keep_flying_group );

        d3note.group = null;
        d3note.keep_flying_group = null;
        d3note.state = note_state.removed;
    }
    /*****************************************************************************************/

    /*****************************************************************************************/
    // Мэнеджер 3D моделей
    /*****************************************************************************************/
    function MeshManager()
    {
        var self = this;

        var mesh_type = {
            GROUP : 'GROUP',
            STRIP : 'STRIP',    // летящая дорожка
            STRIP_NUMBER : 'NUMBER',  // цифра

            // Летящие ноты
            FRET_NOTE : 'FRET_NOTE', // обычный кубик
            OPEN_STRING : 'OPEN_STRING',
            HAMMER : 'HAMMER',
            PULL : 'PULL',
            PULL_MARK : 'PULL_MARK', // используется на открытых струнах
            MUTE : 'MUTE',
            MUTE_MARK : 'MUTE_MARK', // используется на открытых струнах
            DEAD : 'DEAD',
            HARMONIC : 'HARMONIC',
            SLIDE : 'SLIDE',

            NOTE_LEG : 'NOTE_LEG',
            CROSS_MARK : 'CROSS_MARK',
            MEASURE_MARK : 'MEASURE_MARK',
            METER_MARK : 'METER_MARK',

            // Ноты на грифе (ближнем и дальнем)
            STATIC_FRET_NOTE : 'STATIC_FRET_NOTE',  // обычная нота
            STATIC_OPEN_STRING : 'STATIC_OPEN_STRING',  // открытая струна
            STATIC_HAMMER : 'STATIC_HAMMER',
            STATIC_PULL : 'STATIC_PULL',
            STATIC_MUTE : 'STATIC_MUTE'
        };

        var geometry_pool = {};

        var material_pool = {};

        var mesh_pool = {
            group : [],
            strip : [ [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [] ], // для каждого лада (21 лад)
            strip_number : [ [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [], [] ], // для каждого лада (21 лад)

            fret_note : [],
            open_string : [],
            hammer : [],
            pull : [],
            pull_mark : [],
            mute : [],
            mute_mark : [],
            dead : [],
            harmonic_mark : [],

            note_leg : [ [], [], [], [], [], [] ], // под каждую струну
            cross_mark : [],
            measure_mark : [],
            meter_mark : [],

            // Ноты, которые загораются в плоскости грифов
            static_fret_note : [],
            static_open_string : [],
            static_hammer : [],
            static_pull : [],
            static_mute : []
        };

        /*****************************************************************************************/
        self.Init = function()
        {
            // Создаем материалы
            material_pool.string_lambert = [
                new THREE.MeshLambertMaterial ({ color: new THREE.Color( DefineNoteColor( 1, true ))}),
                new THREE.MeshLambertMaterial ({ color: new THREE.Color( DefineNoteColor( 2, true ))}),
                new THREE.MeshLambertMaterial ({ color: new THREE.Color( DefineNoteColor( 3, true ))}),
                new THREE.MeshLambertMaterial ({ color: new THREE.Color( DefineNoteColor( 4, true ))}),
                new THREE.MeshLambertMaterial ({ color: new THREE.Color( DefineNoteColor( 5, true ))}),
                new THREE.MeshLambertMaterial ({ color: new THREE.Color( DefineNoteColor( 6, true ))})
            ];    // под каждую струну
            material_pool.string_basic = [
                new THREE.MeshBasicMaterial ({ color: new THREE.Color( DefineNoteColor( 1, false ))}),
                new THREE.MeshBasicMaterial ({ color: new THREE.Color( DefineNoteColor( 2, false ))}),
                new THREE.MeshBasicMaterial ({ color: new THREE.Color( DefineNoteColor( 3, false ))}),
                new THREE.MeshBasicMaterial ({ color: new THREE.Color( DefineNoteColor( 4, false ))}),
                new THREE.MeshBasicMaterial ({ color: new THREE.Color( DefineNoteColor( 5, false ))}),
                new THREE.MeshBasicMaterial ({ color: new THREE.Color( DefineNoteColor( 6, false ))})
            ];      // под каждую струну
            material_pool.string_clipping = [
                new THREE.MeshLambertMaterial ({ color: new THREE.Color( DefineNoteColor( 1, true )), side: THREE.DoubleSide, clippingPlanes: [ gplayer.clipping_plane_near, gplayer.clipping_plane_far ] }),
                new THREE.MeshLambertMaterial ({ color: new THREE.Color( DefineNoteColor( 2, true )), side: THREE.DoubleSide, clippingPlanes: [ gplayer.clipping_plane_near, gplayer.clipping_plane_far ] }),
                new THREE.MeshLambertMaterial ({ color: new THREE.Color( DefineNoteColor( 3, true )), side: THREE.DoubleSide, clippingPlanes: [ gplayer.clipping_plane_near, gplayer.clipping_plane_far ] }),
                new THREE.MeshLambertMaterial ({ color: new THREE.Color( DefineNoteColor( 4, true )), side: THREE.DoubleSide, clippingPlanes: [ gplayer.clipping_plane_near, gplayer.clipping_plane_far ] }),
                new THREE.MeshLambertMaterial ({ color: new THREE.Color( DefineNoteColor( 5, true )), side: THREE.DoubleSide, clippingPlanes: [ gplayer.clipping_plane_near, gplayer.clipping_plane_far ] }),
                new THREE.MeshLambertMaterial ({ color: new THREE.Color( DefineNoteColor( 6, true )), side: THREE.DoubleSide, clippingPlanes: [ gplayer.clipping_plane_near, gplayer.clipping_plane_far ] })
            ];      // под каждую струну

            material_pool.mark_light = new THREE.MeshBasicMaterial ({ color: 0xffffff, side: THREE.DoubleSide });   // для меток ( обычно белый )
            material_pool.mark_dark = new THREE.MeshBasicMaterial ({ color: 0x1e74b1, side: THREE.DoubleSide });    // подложка для меток ( темно-синий )
            material_pool.cross_mark = new THREE.MeshBasicMaterial ({ color: new THREE.Color( 0x7eb9da )})
            material_pool.strip_numbers = new THREE.MeshBasicMaterial({color: new THREE.Color( 0xAAAAAA )});

            // Создаем геометрии
            geometry_pool.static_fret_note = GeometryStaticFretNote();
            geometry_pool.static_open_string = GeomtryStaticOpenString();
            geometry_pool.static_hammer = null;
            geometry_pool.static_pull = null;

            geometry_pool.fret_note = GeometryFretNote();
            geometry_pool.open_string = GeometryOpenString();
            geometry_pool.hammer = null;
            geometry_pool.pull = null;
            geometry_pool.pull_mark = null;
            geometry_pool.mute = null;
            geometry_pool.mete_mark = null;
            geometry_pool.dead = null;

            geometry_pool.note_leg = [
                GeometryNoteLeg( 0 ),
                GeometryNoteLeg( 1 ),
                GeometryNoteLeg( 2 ),
                GeometryNoteLeg( 3 ),
                GeometryNoteLeg( 4 ),
                GeometryNoteLeg( 5 )
            ]; // под каждую струну

            geometry_pool.cross_mark = GeometryCrossMark();
            geometry_pool.measure_mark = GeometryMeasureMark();
            geometry_pool.meter_mark = GeometryMeterMark();

            // Numbers
            geometry_pool.strip_numbers = [];

            for ( var i = 0; i < 21; i++ )
            {
                geometry_pool.strip_numbers[i] = GeometryStripNumber( i + 1 );
                mesh_pool.strip_number[i].push( CreateStripFretNumber( i )); // сразу создаем мэши
            }
        }
        /*****************************************************************************************/
        self.CreateText = function( text, font_size, color )
        {
            text = text + "";

            var geometry = new THREE.TextBufferGeometry( text, {
                font: gplayer.font_ubuntu_bold,
                size: font_size,
                height: 0,
                curveSegments: 0
            });

            geometry.center();

            var mesh = new THREE.Mesh( geometry, new THREE.MeshBasicMaterial({color: new THREE.Color( color ), side: THREE.DoubleSide }) );
            mesh.rotation.z = Math.PI / 2 * (-1);
            mesh.rotation.y = Math.PI / 2 * (-1);

            return mesh;
        }
        /*****************************************************************************************/
        self.CreateStripFretNumbers = function( group )
        {
            // перебираем лады
            for ( var fret = current_strip_fly.fret_min; fret <= current_strip_fly.fret_max; fret++ )
            {
                if ( fret >= prev_fly_strip.fret_min && fret <= prev_fly_strip.fret_max )
                    continue;

                // Проверяем наличие в кэше
                var mesh = mesh_pool.strip_number[fret].pop();

                if ( typeof mesh == 'undefined')
                    mesh = CreateStripFretNumber( fret );

                mesh.position.y = sceneParams.middle_fret_grid[ fret ]; // Выравнивание по центру лада;
                mesh.position.z = sceneParams.edge_fret_grid[ fret ].min.z - 5;

                group.add( mesh );
            } // for
        }
        /*****************************************************************************************/
        self.GetFlyingStrip = function ( fret )
        {
            var strip = fret_strips[ fret ]; // исходная модель дорожки

            // Проверяем в кэше
            var fly_strip = mesh_pool.strip[fret].pop();

            if ( fly_strip ) // если найдено в кэше
            {
                fly_strip.ID = strip_id++;
                fly_strip.dimensions.x = 0;
                fly_strip.state = fly_strip_state.growing;
                delete fly_strip.end_note;

                fly_strip.mesh.position.x = sceneParams.point_start;
            }
            else // создаем
            {
                // Клонируем и Добавляем новую дорожку
                var mesh = strip.mesh.clone();

                var dimensions = strip.dimensions.clone();
                dimensions.x = 0;

                fly_strip = {
                    ID : strip_id++,
                    mesh : mesh,
                    dimensions : dimensions,
                    state : fly_strip_state.growing,
                    fret : fret,
                    gp_type : mesh_type.STRIP
                };
            }

            // задаем размеры дорожки (boundingBox почему-то не пересчитывается)
            meshManager.ScaleToSizeX( fly_strip.mesh, strip.dimensions.x, 0 );

            fret_strips[fret].flying.push( fly_strip );

            return fly_strip;
        }
        /*****************************************************************************************/
        self.GetStaticNote = function( note, opacity, ringing ) // нота с прозрачностью, на дальнем или ближнем грифе
        {
            ringing = ringing || false;
            var mesh = null;

            // ЗАКРЫТЫЕ СТРУНЫ
            if ( note.value > 0 )
            {
                // Hammer / Pull
                if ( note.effect.hammer || note.effect.pull )
                {
                    mesh = CreateStaticHammerPull( note, opacity );
                }
                else // обычная нота
                {
                    mesh = CreateStaticFretNote( note, opacity );
                }
            }
            else // ОТКРЫТЫЕ СТРУНЫ
            {
                mesh = CreateStaticOpenString( note, opacity, ringing );
            } // Открытые струны

            return mesh;
        }
        /*****************************************************************************************/
        self.GetFlyingNote = function( note, duration_msec )
        {
            var mesh = null;
            var group = self.GetGroup( true );

            var color = DefineNoteColor( note.string, note.value, note.effect );

            // ЗАКРЫТЫЕ СТРУНЫ
            if ( note.value > 0 )
            {
                var create_regular_note = false;

                if ( note.effect.hammer || note.effect.pull ) // Hammer / Pull
                {
                    mesh = CreateHammerPull( note, color );
                }
                else
                if ( note.effect.palmMute ) // Palm Mute
                {
                    mesh = CreateMutedNote( color );
                }
                else
                if ( note.effect.deadNote ) // Dead Note
                {
                    mesh = CreateDeadNoteMark( note );
                }
                else
                if ( note.effect.harmonic )
                {
                    mesh = CreateHarmonic( note );
                    create_regular_note = true;
                }
                else
                if ( note.effect.slide )
                {
                    mesh = CreateSlide( note, duration_msec, note.effect.slide );
                    create_regular_note = true;
                }

                CompileFretNote( note, color, group, mesh, create_regular_note );
            }
            else // ОТКРЫТЫЕ СТРУНЫ
            {
                var mark = null;

                // Pull off
                if ( note.effect.pull )
                {
                    mark = CreatePullMark( note, true, true );
                }
                else // Dead Note
                if ( note.effect.deadNote )
                {
                    mark = CreateDeadNoteMark( note, true );
                }
                else
                if ( note.effect.palmMute )
                {
                    mark = CreateMuteMark( color, note.string );
                }

                CompileOpenString( note, color, group, mark );
            } // Открытые струны

            return group;
        } // CreateFlyingNote
        /*****************************************************************************************/
        self.GetGroup = function( reset_pos )
        {
            reset_pos = reset_pos || false;

            var group = mesh_pool.group.pop();

            if ( group )
            {
                if ( reset_pos )
                    group.position.set( 0, 0, 0 );
            }
            else
                group = new THREE.Object3D();

            return group;
        }
        /*****************************************************************************************/
        self.CreateNoteCrossMarking = function( measure_mark )
        {
            measure_mark = measure_mark || false;
            var type = mesh_type.CROSS_MARK;

            var mesh = null;

            // ищем в кэше
            if ( measure_mark ) // Если это тактовый разделитель
            {
                type = mesh_type.MEASURE_MARK;
                mesh = mesh_pool.measure_mark.pop();
            }
            else
                mesh = mesh_pool.cross_mark.pop();

            // Если модель не найдена в кэше
            if ( typeof mesh == 'undefined' )
            {
                if ( measure_mark )
                    mesh = new THREE.Mesh( geometry_pool.measure_mark, material_pool.mark_light );
                else
                    mesh = new THREE.Mesh( geometry_pool.cross_mark, material_pool.cross_mark );

                mesh.gp_type = type;
            }

            self.ScaleToSizeY( mesh, 1, current_strip_fly.strip_width );

            mesh.position.x = 0;
            mesh.position.y = current_strip_fly.strip_min_box.max.y;
            mesh.position.z = sceneParams.floor_z;

            return mesh;
        }
        /*****************************************************************************************/
        self.CreateMeterMark = function()
        {
            // Ищем в кэше
            var mesh = mesh_pool.meter_mark.pop();

            if ( typeof mesh == 'undefined' ) // если НЕ найдено
            {
                mesh = new THREE.Mesh( geometry_pool.meter_mark, material_pool.mark_light );

                mesh.gp_type = mesh_type.METER_MARK;
            }

            mesh.position.x = 0;
            mesh.position.y = current_strip_fly.strip_max_box.min.y;
            mesh.position.z = sceneParams.floor_z;

            return mesh;
        }
        /*****************************************************************************************/
        function DefineNoteColor( string, fret, effect )
        {
            fret = fret || false; // номер лада ( или ноль если струна открытая )
            effect = effect || false; // эффекты хаммер / пул

            var color =  0;

            switch( string )
            {
                case 1: // Ми
                    if ( fret )
                        color = 0x9d30a3;
                    else
                        color = 0xd46ada; // открытая струна
                    break;
                case 2: // Си
                    if ( fret )
                        color = 0x3f822c;
                    else
                        color = 0x73f051;
                    break;
                case 3: // Соль
                    if ( fret ) // прижатая струна
                        color = 0xe56202;
                        // color = 0xfa7102;
                    else
                        color = 0xffb502; // открытая струна
                    break;
                case 4: // Ре
                    if ( fret )
                        color = 0x1068ad;
                    else
                        color = 0x1dbffe;
                    break;
                case 5: // Ля
                    if ( fret )
                        color = 0xb7af25;
                    else
                        color = 0xfeff43;
                    break;
                case 6: // Ми
                    if ( fret )
                        color = 0x9c383a;
                        // color = 0xcf2728; // темно-красный
                    else
                        color = 0xff666b;
                        // color = 0xf24b4b;
                    break;
            }

            return color;
        }
        /*****************************************************************************************/
        function CompileFretNote( note, color, group, mesh, create_regular_note )
        {
            mesh = mesh || null;
            create_regular_note = create_regular_note || false;

            // Кубик
            if ( mesh == null || typeof mesh == 'undefined' ) // если модель не была создана заранее
            {
                mesh = CreateFretNote( note, color );
            }
            else
            if ( create_regular_note ) // добавить обычный кубик
            {
                var note_mesh = CreateFretNote( note, color );

                // позиция кубика
                note_mesh.position.set( 0,
                    sceneParams.middle_fret_grid[ note.value - 1 ], // Выравнивание по центру лада
                    sceneParams.strings_coord_z[ note.string - 1 ] );

                group.add( note_mesh );
            }

            // позиция ноты
            mesh.position.set( 0,
                sceneParams.middle_fret_grid[ note.value - 1 ], // Выравнивание по центру лада
                sceneParams.strings_coord_z[ note.string - 1 ] );

            group.add( mesh );

            // Ножка
            mesh = CreateNoteLeg( note );

            mesh.position.set( 0,
                sceneParams.middle_fret_grid[ note.value - 1 ], // Выравнивание по центру лада
                sceneParams.strings_coord_z[ note.string - 1 ] );

            group.add( mesh );

            return group;
        }
        /*****************************************************************************************/
        function CompileOpenString( note, color, group, mark )
        {
            var mesh = CreateOpenStringMesh( note, color );

            // сохраняем параметры, чтобы потом отобразить звучащую ноту
            note.local_data.open_string_pos = mesh.position.y - current_strip_fly.strip_width / 2;
            note.local_data.width_y = current_strip_fly.strip_width;

            group.add( mesh );

            // ножка слева
            mesh = mesh_pool.note_leg[note.string - 1].pop();

            if ( typeof mesh == 'undefined' )
                mesh = CreateNoteLeg( note );

            mesh.position.set( 0,
                sceneParams.edge_fret_grid[ current_strip_fly.fret_min ].max.y,
                sceneParams.strings_coord_z[ note.string - 1 ] );

            group.add( mesh );

            // Метка приема
            if ( mark )
            {
                mark.position.set( 0,
                    sceneParams.edge_fret_grid[ current_strip_fly.fret_min ].max.y,
                    sceneParams.strings_coord_z[ note.string - 1 ] );

                group.add( mark );
            }

            return group;
        }
        /*****************************************************************************************/
        function CreateStripFretNumber( fret )
        {
            var mesh = new THREE.Mesh( geometry_pool.strip_numbers[ fret ], material_pool.strip_numbers );
            mesh.rotation.z = Math.PI / 2 * (-1);
            mesh.rotation.y = Math.PI / 2 * (-1);

            mesh.fret = fret;
            mesh.gp_type = mesh_type.STRIP_NUMBER;

            return mesh;
        }
        /*****************************************************************************************/
        function CreateStaticHammerPull( note, opacity )
        {
            var mesh = null;

            if ( note.effect.hammer )
                mesh = mesh_pool.static_hammer.pop();
            else
                mesh = mesh_pool.static_pull.pop();

            if ( typeof mesh == 'undefined' ) // если не найдено в кэше
            {
                var geometry = new THREE.ConeGeometry( 2.5, 4.25, 2, 1, false, 0.8 );
                mesh = new THREE.Mesh( geometry, new THREE.MeshBasicMaterial ({ color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: opacity }));

                mesh.geometry = new THREE.BufferGeometry().fromGeometry( mesh.geometry );

                // поворот
                if ( note.effect.hammer )
                {
                    mesh.rotation.x = (-1) * Math.PI / 2;
                    mesh.gp_type = mesh_type.STATIC_HAMMER;
                }
                else // pull
                {
                    mesh.rotation.x = Math.PI / 2;
                    mesh.gp_type = mesh_type.STATIC_PULL;
                }

                mesh.rotation.y = (-1) * Math.PI / 4;
            }
            else
                mesh.material.opacity = opacity;

            mesh.position.set( 0,
                sceneParams.middle_fret_grid[ note.value - 1 ], // Выравнивание по центру лада
                sceneParams.strings_coord_z[ note.string - 1 ] );

            return mesh;
        }
        /*****************************************************************************************/
        function CreateStaticFretNote( note, opacity )
        {
            var mesh = mesh_pool.static_fret_note.pop();

            if ( typeof mesh == 'undefined' ) // если не найдено в кэше
            {
                // Создаем mesh
                mesh = new THREE.Mesh( geometry_pool.static_fret_note,
                                       new THREE.MeshBasicMaterial ({ color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: opacity }));

                mesh.rotation.y = Math.PI / 2; // поворот плоскости параллельно грифу

                mesh.gp_type = mesh_type.STATIC_FRET_NOTE;
            }

            mesh.position.set( 0,
                sceneParams.middle_fret_grid[ note.value - 1 ],
                sceneParams.strings_coord_z[ note.string - 1 ] );

            return mesh;
        }
        /*****************************************************************************************/
        function CreateStaticOpenString( note, opacity, ringing )
        {
            var current_strip = ringing ? current_strip_play : current_strip_preflight;
            var length = current_strip.strip_width; // Размеры ноты

            // ищем в кэше
            var mesh = mesh_pool.static_open_string.pop();

            if ( typeof mesh == 'undefined' ) // если не найдено
            {
                // Создаем mesh ( прямоугольник, вытянутый на ширину дорожки)
                mesh = new THREE.Mesh( geometry_pool.static_open_string,
                                       new THREE.MeshBasicMaterial ({ color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: opacity }));

                mesh.rotation.y = Math.PI / 2; // поворот плоскости параллельно грифу

                mesh.gp_type = mesh_type.STATIC_OPEN_STRING;
            }

            self.ScaleToSizeY( mesh, 1, length ); // длина модели (оригинальная длина известна)

            mesh.position.set( 0,
                sceneParams.edge_fret_grid[ current_strip.fret_max ].min.y + length / 2,
                sceneParams.strings_coord_z[ note.string - 1 ] );

            return mesh;
        }
        /*****************************************************************************************/
        function CreateNoteLeg( note )
        {
            // Ищем в кэше
            var mesh = mesh_pool.note_leg[note.string - 1].pop();

            if ( mesh ) // если найдено
                return mesh;

            mesh = new THREE.Mesh( geometry_pool.note_leg[ note.string - 1 ],
                                   material_pool.mark_light );

            mesh.string = note.string; // сохраняем номер струны, чтобы потом вернуть в нужный массив моделей
            mesh.gp_type = mesh_type.NOTE_LEG;

            return mesh;
        }
        /*****************************************************************************************/
        function CreateFretNote( note, color )
        {
            var mesh = mesh_pool.fret_note.pop(); // берем из массива

            if ( mesh )
                mesh.material = material_pool.string_lambert[ note.string - 1 ]; // set color
            else // создаем новую модель
            {
                mesh = new THREE.Mesh( geometry_pool.fret_note,
                                       material_pool.string_lambert[ note.string - 1 ]);

                mesh.gp_type = mesh_type.FRET_NOTE;
            }

            return mesh;
        }
        /*****************************************************************************************/
        function CreateOpenStringMesh( note, color )
        {
            // размеры ноты
            var note_length = current_strip_fly.strip_min_box.max.y - current_strip_fly.strip_min_box.min.y;

            // Ищем в кэше
            mesh = mesh_pool.open_string.pop();

            if ( mesh ) // если найдено
            {
                mesh.material = material_pool.string_basic[ note.string - 1 ]; // Задаем цвет
            }
            else // делаем новую модель
            {
                // конус
                var mesh = new THREE.Mesh( geometry_pool.open_string, material_pool.string_basic[ note.string - 1 ]);
                mesh.gp_type = mesh_type.OPEN_STRING;
            }

            // позиция треугольника
            mesh.position.set( 0,
                sceneParams.edge_fret_grid[ current_strip_fly.fret_min ].max.y,
                sceneParams.strings_coord_z[ note.string - 1 ] );

            return mesh;
        }
        /*****************************************************************************************/
        function CreateHammerPull( note, color )
        {
            var mesh = null;

            // Проверяем наличие модели в кэше
            if ( note.effect.hammer )
                mesh = mesh_pool.hammer.pop();
            else
            if ( note.effect.pull )
                mesh = mesh_pool.pull.pop();

            if ( mesh ) // если найдено
            {
                mesh.material.color = new THREE.Color( color );
                return mesh;
            }

            // создаем новую модель
            var theta_start = 0;

            if ( note.effect.hammer )
                 theta_start = 1;

            var geometry = new THREE.CylinderGeometry( 2.75, 2.75, 1.5, 3, 1, false, theta_start, 6.3 );
            mesh = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial ({ color: color }));

            mesh.rotation.z = Math.PI / 2;

            mesh.geometry = new THREE.BufferGeometry().fromGeometry( mesh.geometry );

            // Указываем тип модели
            if ( note.effect.hammer )
                mesh.gp_type = mesh_type.HAMMER;
            else
                mesh.gp_type = mesh_type.PULL;

            return mesh;
        }
        /*****************************************************************************************/
        function CreatePullMark( note, pull ) // если pull = true, тогда треугольник указывает вверх
        {
            // Ищем в кэше
            var mesh = mesh_pool.pull_mark.pop();

            // Если найдено
            if ( mesh )
                return mesh;

            // Создаем новую модель
            var group = new THREE.Object3D();

            var geometry1 = new THREE.ConeGeometry( 1.3, 2, 2, 1, false, 0.8 );     // основной цвет
            var geometry2 = new THREE.ConeGeometry( 1.7, 2.5, 2, 1, false, 0.8 );   // обводка

            var mesh1 = new THREE.Mesh( geometry1, new THREE.MeshBasicMaterial ({ color: 0xffffff }));
            var mesh2 = new THREE.Mesh( geometry2, new THREE.MeshBasicMaterial ({ color: 0x1e74b1 }));

            mesh1.geometry = new THREE.BufferGeometry().fromGeometry( mesh1.geometry );
            mesh2.geometry = new THREE.BufferGeometry().fromGeometry( mesh2.geometry );

            // поворот
            mesh1.rotation.x = Math.PI / 2;
            mesh2.rotation.x = Math.PI / 2;

            mesh1.rotation.y = (-1) * Math.PI / 4;
            mesh2.rotation.y = (-1) * Math.PI / 4;

            // смещение треугольников относительно друг друга
            mesh1.position.x = -0.2;
            mesh2.position.x = -0.1;

            group.add( mesh1 );
            group.add( mesh2 );

            group.gp_type = mesh_type.PULL_MARK;

            return group;
        }
        /*****************************************************************************************/
        function CreateDeadNoteMark( note, open_string )
        {
            // Ищем в кэше
            var mesh = mesh_pool.dead.pop();

            if ( mesh )
                return mesh;

            // Создаем новую модель
            open_string = open_string || false;

            var group = new THREE.Object3D();

            // Основной цвет
            var geometry = new THREE.BoxGeometry( 0.25, 4.25, 0.7 );
            var mesh1 = new THREE.Mesh( geometry, material_pool.mark_light );
            var mesh2 = mesh1.clone();

            // Обводка
            geometry = new THREE.BoxGeometry( 0.15, 4.75, 1.2 );
            var mesh3 = new THREE.Mesh( geometry, material_pool.mark_dark );
            var mesh4 = mesh3.clone();

            mesh1.rotation.x = Math.PI / 5;
            mesh2.rotation.x = (-1) * Math.PI / 5;
            mesh3.rotation.x = Math.PI / 5;
            mesh4.rotation.x = (-1) * Math.PI / 5;

            mesh1.geometry = new THREE.BufferGeometry().fromGeometry( mesh1.geometry );
            mesh2.geometry = new THREE.BufferGeometry().fromGeometry( mesh2.geometry );
            mesh3.geometry = new THREE.BufferGeometry().fromGeometry( mesh3.geometry );
            mesh4.geometry = new THREE.BufferGeometry().fromGeometry( mesh4.geometry );

            mesh1.position.x = -0.2;
            mesh2.position.x = -0.2;

            group.add( mesh1 );
            group.add( mesh2 );
            group.add( mesh3 );
            group.add( mesh4 );

            group.gp_type = mesh_type.DEAD;

            return group;
        }
        /*****************************************************************************************/
        function CreateMutedNote( color )
        {
            // Ищем в кэше
            var mesh = mesh_pool.mute.pop();

            if ( mesh ) // если найдено
                return mesh;

            // Сoздаем новую модель
            var group = new THREE.Object3D();

            var geometry = new THREE.BoxGeometry( 0.5, 5, 1 );
            var mesh1 = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial ({ color: color }));
            var mesh2 = mesh1.clone();

            mesh1.rotation.x = Math.PI / 5;
            mesh2.rotation.x = (-1) * Math.PI / 5;

            mesh1.geometry = new THREE.BufferGeometry().fromGeometry( mesh1.geometry );
            mesh2.geometry = new THREE.BufferGeometry().fromGeometry( mesh2.geometry );

            group.add( mesh1 );
            group.add( mesh2 );

            group.gp_type = mesh_type.MUTE;

            return group;
        }
        /*****************************************************************************************/
        function CreateMuteMark( color, string )
        {
            // Ищем в кэше
            var mesh = mesh_pool.mute_mark.pop();

            if ( mesh )
                return mesh;

            // Создаем новую модель
            var group = new THREE.Object3D();

            // Основной цвет
            var geometry = new THREE.BoxGeometry( 0.25, 4.25, 0.7 );
            var mesh1 = new THREE.Mesh( geometry, new THREE.MeshBasicMaterial ({ color: color }));
            var mesh2 = mesh1.clone();

            // Обводка
            geometry = new THREE.BoxGeometry( 0.15, 4.75, 1.2 );
            var mesh3 = new THREE.Mesh( geometry, new THREE.MeshBasicMaterial ({ color: 0xffffff }));
            var mesh4 = mesh3.clone();

            mesh1.rotation.x = Math.PI / 5;
            mesh2.rotation.x = (-1) * Math.PI / 5;
            mesh3.rotation.x = Math.PI / 5;
            mesh4.rotation.x = (-1) * Math.PI / 5;

            mesh1.geometry = new THREE.BufferGeometry().fromGeometry( mesh1.geometry );
            mesh2.geometry = new THREE.BufferGeometry().fromGeometry( mesh2.geometry );
            mesh3.geometry = new THREE.BufferGeometry().fromGeometry( mesh3.geometry );
            mesh4.geometry = new THREE.BufferGeometry().fromGeometry( mesh4.geometry );

            mesh1.position.x = -0.2;
            mesh2.position.x = -0.2;

            group.add( mesh1 );
            group.add( mesh2 );
            group.add( mesh3 );
            group.add( mesh4 );

            group.gp_type = mesh_type.MUTE_MARK;

            return group;
        }
        /*****************************************************************************************/
        function CreateHarmonic( note )
        {
            // Значок флажолета
            var mesh = mesh_pool.harmonic_mark.pop();

            if ( typeof mesh == 'undefined' )
            {
                // Сoздаем
                var materials = [ material_pool.mark_light, material_pool.mark_dark ];

                var mesh = new THREE.Mesh( GeometryHarmonic(), materials );
                mesh.gp_type = mesh_type.HARMONIC;
            }

            return mesh;
        }
        /*****************************************************************************************/
        function CreateSlide( note, duration_msec, slide )
        {
            var fret_1 = note.value;
            var fret_2 = slide.next_fret;

            // Вычисляем путь для выдавливания
            var deltaX = duration_msec * sceneParams.flight_speed_default;
            var deltaY = sceneParams.middle_fret_grid[ fret_2 - 1 ] - sceneParams.middle_fret_grid[ fret_1 - 1 ];

            // точки пути
            var points = [];
            points.push( new THREE.Vector3( 0, -1.45, 0 )); // первая нота

            points.push( new THREE.Vector3( deltaX * 0.1, -2.5, 0 ));

            points.push( new THREE.Vector3( deltaX * 0.9, deltaY - 0.5, 0 ));

            points.push( new THREE.Vector3( deltaX, deltaY - 1.45, 0 )); // вторая нота

            var path =  new THREE.CatmullRomCurve3( points );

            var extrudeSettings = {
                steps			: 200,
                bevelEnabled	: false,
                extrudePath		: path
            };

            // форма для выдавливания
            var length = 0.5, width = 3;

            var shape = new THREE.Shape();
            shape.moveTo( 0,0 );
            shape.lineTo( 0, width );
            shape.lineTo( length, width );
            shape.lineTo( length, 0 );
            shape.lineTo( 0, 0 );

            var geometry = new THREE.ExtrudeGeometry( shape, extrudeSettings );

            var material = material_pool.string_clipping[ note.string - 1 ]; // set color

            var mesh = new THREE.Mesh( geometry, material );

            mesh.gp_type = mesh_type.SLIDE;

            return mesh;
        }
        /*****************************************************************************************/
        // GEOMETRIES
        /*****************************************************************************************/
        function GeometryStripNumber( fret )
        {
            var geometry = new THREE.TextBufferGeometry( fret, {
                font: gplayer.font_ubuntu_bold,
                size: 3,
                height: 0,
                curveSegments: 0
            });

            geometry.center();

            return geometry;
        }
        /*****************************************************************************************/
        function GeometryStaticFretNote()
        {
            return new THREE.PlaneBufferGeometry( 3, 4.5 );
        }
        /*****************************************************************************************/
        function GeomtryStaticOpenString()
        {
            return new THREE.PlaneBufferGeometry( 1.2, 1 );
        }
        /*****************************************************************************************/
        function GeometryFretNote()
        {
            var dimensions = new THREE.Vector3( 1.5, 4.5, 3 ); // размеры ноты
            return new THREE.BoxBufferGeometry( dimensions.x, dimensions.y, dimensions.z );
        }
        /*****************************************************************************************/
        function GeometryOpenString()
        {
            var note_length = 12;
            var note_width = 1.2;

            var geometry = new THREE.ConeGeometry( note_width, note_length, 4, 1, false, 0.8 );
            geometry.rotateZ( Math.PI );

            geometry.scale( 0, 1, 1 ); // делаем треугольник плоским

            // смещаем pivot в крайнюю левую точку
            self.MoveVertices( geometry.vertices, 0, (-1) * note_length / 2, 0 );

            geometry.sizeY = note_length;

            geometry = new THREE.BufferGeometry().fromGeometry( geometry ); // convert

            return geometry;
        }
        /*****************************************************************************************/
        function GeometryNoteLeg( string )
        {
            var height = sceneParams.strings_coord_z[ string ] - sceneParams.floor_z;
            var geometry = new THREE.BoxGeometry( 0.1, 0.1, height );

            self.MoveVertices( geometry.vertices, 0, 0, height / 2 * (-1));

            return new THREE.BufferGeometry().fromGeometry( geometry );
        }
        /*****************************************************************************************/
        function GeometryCrossMark()
        {
            var geometry = new THREE.PlaneGeometry( 0.4, 1 );
            self.CenterGeometry( geometry );

            // смещаем pivot в верхний край
            self.MoveVertices( geometry.vertices, 0, -0.5, 0 );

            geometry = new THREE.BufferGeometry().fromGeometry( geometry ); // convert

            return geometry;
        }
        /*****************************************************************************************/
        function GeometryMeasureMark()
        {
            var geometry = new THREE.PlaneGeometry( 1, 1 );
            self.CenterGeometry( geometry );

            // смещаем pivot в верхний край
            self.MoveVertices( geometry.vertices, 0, -0.5, 0 );

            geometry = new THREE.BufferGeometry().fromGeometry( geometry ); // convert

            return geometry;
        }
        /*****************************************************************************************/
        function GeometryMeterMark()
        {
            var geometry = new THREE.PlaneGeometry( 1, 2 );

            // смещаем pivot в верхний край
            self.MoveVertices( geometry.vertices, 0, -1, 0 );

            geometry = new THREE.BufferGeometry().fromGeometry( geometry ); // convert

            return geometry;
        }
        /*****************************************************************************************/
        function GeometryHarmonic()
        {
            var geometry = new THREE.Geometry();

            // Основной значок
            var ring = new THREE.RingGeometry(
                1.2,  // inner radius
                2, // outer radius
                12, // theta segments
                1 );// phiSegments

            var circle = new THREE.CircleGeometry(
                0.8,  // radius
                12 ); // segments

            ring.translate( 0, 0, -0.2 );
            circle.translate( 0, 0, -0.2 );

            geometry.merge( ring, undefined, 0 );
            geometry.merge( circle, undefined, 0 );

            // Обводка
            ring = new THREE.RingGeometry(
                1.1,  // inner radius
                2.1, // outer radius
                12, // theta segments
                1 );// phiSegments

            circle = new THREE.CircleGeometry(
                0.9,  // radius
                12 ); // segments

            geometry.merge( ring, undefined, 1 );
            geometry.merge( circle, undefined, 1 );

            geometry.rotateY( Math.PI / 2 );
            geometry.translate( -0.8, 0, 0 );

            return new THREE.BufferGeometry().fromGeometry( geometry );
        }
        /*****************************************************************************************/
        /*****************************************************************************************/
        /*****************************************************************************************/
        // POOL FUNCTIONS
        /*****************************************************************************************/
        self.ReturnMesh = function ( mesh, mesh_type_to_keep, new_group )
        {
            mesh_type_to_keep = mesh_type_to_keep || [];
            new_group = new_group || false;

            if ( mesh.type == 'Object3D' && typeof mesh.gp_type == 'undefined' ) // без типа, значит это контейнер и внутри есть модели
            {
                var group = mesh;

                // Разбираем группу на запчасти и рассовываем по массивам
                while( group.children.length > 0 )
                {
                    var single_mesh = group.children.pop();

                    //if ( typeof single_mesh.gp_type == 'undefined' && single_mesh.type == 'Object3D' ) // снова контейнер
                    if ( single_mesh.type == 'Object3D' )
                    {
                        self.ReturnMesh( single_mesh, mesh_type_to_keep, new_group ); // перебираем рекурсивно
                    }
                    else
                    {
                        group.remove( single_mesh ); // experiment
                        gplayer.scene.remove( single_mesh );

                        if ( typeof single_mesh.gp_type != 'undefined' ) // указан тип модели
                        {
                            var idx = mesh_type_to_keep.indexOf( single_mesh.gp_type );

                            if ( idx != -1 && new_group )
                                new_group.add( single_mesh );
                            else
                                ReturnSingleMesh( single_mesh ); // фасуем и сохраняем
                        }
                    }
                } // while

                if ( group.parent )
                    group.parent.remove( group );

                mesh_pool.group.push( group ); // сохраняем контейнер
            }
            else // указан тип модели
            {
                ReturnSingleMesh( mesh ); // сразу возвращаем в массив
            }
        }
        /*****************************************************************************************/
        function ReturnSingleMesh( mesh ) // вернуть ноту
        {
            if ( typeof mesh.gp_type != 'undefined' )
            {
                switch( mesh.gp_type )
                {
                    case mesh_type.STRIP: // объект содержащий mesh как один из элементов ( исключение из общего правила )
                        mesh_pool.strip[ mesh.fret ].push( mesh );
                        break;
                    case mesh_type.STRIP_NUMBER:
                        mesh_pool.strip_number[ mesh.fret ].push( mesh );
                        break;
                    case mesh_type.FRET_NOTE:
                        mesh_pool.fret_note.push( mesh );
                        break;
                    case mesh_type.OPEN_STRING:
                        mesh_pool.open_string.push( mesh );
                        break;
                    case mesh_type.HAMMER:
                        mesh_pool.hammer.push( mesh );
                        break;
                    case mesh_type.PULL:
                        mesh_pool.pull.push( mesh );
                        break;
                    case mesh_type.PULL_MARK: // используется на открытых струнах
                        mesh_pool.pull_mark.push( mesh );
                        break;
                    case mesh_type.MUTE:
                        mesh_pool.mute.push( mesh );
                        break;
                    case mesh_type.MUTE_MARK: // используется на открытых струнах
                        mesh_pool.mute_mark.push( mesh );
                        break;
                    case mesh_type.DEAD:
                        mesh_pool.dead.push( mesh );
                        break;
                    case mesh_type.HARMONIC:
                        mesh_pool.harmonic_mark.push( mesh );
                        break;

                    case mesh_type.NOTE_LEG:
                        mesh_pool.note_leg[ mesh.string - 1 ].push( mesh );
                        break;
                    case mesh_type.CROSS_MARK:
                        mesh_pool.cross_mark.push( mesh );
                        break;
                    case mesh_type.MEASURE_MARK:
                        mesh_pool.measure_mark.push( mesh );
                        break;
                    case mesh_type.METER_MARK:
                        mesh_pool.meter_mark.push( mesh );
                        break;

                    case mesh_type.STATIC_HAMMER:
                        mesh_pool.static_hammer.push( mesh );
                        break;
                    case mesh_type.STATIC_PULL:
                        mesh_pool.static_pull.push( mesh );
                        break;
                    case mesh_type.STATIC_FRET_NOTE:
                        mesh_pool.static_fret_note.push( mesh );
                        break;
                    case mesh_type.STATIC_OPEN_STRING:
                        mesh_pool.static_open_string.push( mesh );
                        break;

                    default:
                        mesh = null; // просто удаляем безвозвратно
                } // switch
            }
        }
        /*****************************************************************************************/
        // UTIL functions
        /*****************************************************************************************/
        self.MoveVertices = function( vertices, x, y, z )
        {
            for (var i = 0; i < vertices.length; i++) {
                vertices[i].x += x;
                vertices[i].y += y;
                vertices[i].z += z;
            }
        }
        /*****************************************************************************************/
        self.ScaleToSizeX = function( mesh, origin_size_x, new_size_x )
        {
            new_size_x = new_size_x >= 0 ? new_size_x : 0;
            mesh.scale.x = new_size_x / origin_size_x;
        }
        /*****************************************************************************************/
        self.ScaleToSizeY = function( mesh, origin_size_y, new_size_y )
        {
            new_size_y = new_size_y >= 0 ? new_size_y : 0;
            mesh.scale.y = new_size_y / origin_size_y;
        }
        /*****************************************************************************************/
        self.ScaleToSizeZ = function ( mesh, origin_size_z, new_size_z )
        {
            new_size_z = new_size_z >= 0 ? new_size_z : 0;
            mesh.scale.z = new_size_z / origin_size_z;
        }
        /*****************************************************************************************/
        self.CenterMesh = function( mesh )
        {
            var xmin = Infinity;
            var xmax = -Infinity;
            var ymin = Infinity;
            var ymax = -Infinity;
            var zmin = Infinity;
            var zmax = -Infinity;

            for ( var i = 0; i < mesh.geometry.vertices.length; i++ )
            {
                var v = mesh.geometry.vertices[i];

                if (v.x < xmin)
                    xmin = v.x;
                else
                if (v.x > xmax)xmax = v.x;
                if (v.y < ymin )
                    ymin = v.y;
                else
                if (v.y > ymax)
                    ymax = v.y;
                if (v.z < zmin)
                    zmin = v.z;
                else
                if (v.z > zmax)
                    zmax = v.z;
            }

            /* translate the center of the object to the origin */
            var centerX = ( xmin + xmax ) / 2;
            var centerY = ( ymin + ymax ) / 2;
            var centerZ = ( zmin + zmax ) / 2;

            mesh.position.set( -centerX, -centerY - 50, -centerZ );

            return mesh;
        }
        /*****************************************************************************************/
        self.CenterGeometry = function( geometry )
        {
            var xmin = Infinity;
            var xmax = -Infinity;
            var ymin = Infinity;
            var ymax = -Infinity;
            var zmin = Infinity;
            var zmax = -Infinity;

            // Ищем экстремумы
            for ( var i = 0; i < geometry.vertices.length; i++ )
            {
                var v = geometry.vertices[i];

                if (v.x < xmin)
                    xmin = v.x;
                else
                if (v.x > xmax)xmax = v.x;
                if (v.y < ymin )
                    ymin = v.y;
                else
                if (v.y > ymax)
                    ymax = v.y;
                if (v.z < zmin)
                    zmin = v.z;
                else
                if (v.z > zmax)
                    zmax = v.z;
            }

            // задаем новые координаты
            for ( var i = 0; i < geometry.vertices.length; i++ )
            {
                var v = geometry.vertices[i];

                v.x = v.x - xmin - ( xmax - xmin ) / 2;
                v.y = v.y - ymin - ( ymax - ymin ) / 2;
                v.z = v.z - zmin - ( zmax - zmin ) / 2;
            }
        }
        /*****************************************************************************************/
        self.MovePivot = function( mesh, x, y, z ) // vector содержит расстояния смещений по осям
        {
            if ( mesh.geometry )
                self.MoveVertices( mesh.geometry.vertices, x, y, z );
            else // составная модель
            {
                for (var i = 0; i < mesh.children.length; i++)
                    self.MoveVertices( mesh.children[i].geometry.vertices, x, y, z );
            }
        }
        /*****************************************************************************************/
        self.GetGeometryDimensions = function( geometry )
        {
            if ( typeof geometry.boundingBox === 'undefined' || geometry.boundingBox == null )
                typeof geometry.computeBoundingBox();

            var box = geometry.boundingBox;

            return new THREE.Vector3( box.max.x - box.min.x,
                                      box.max.y - box.min.y,
                                      box.max.z - box.min.z );
        }
        /*****************************************************************************************/
    }
} // gpVisual

/*****************************************************************************************/
// Базовый класс GPlayer
// Инкапсулирует отдельные отображения и определяет их общий интерфейс, а также получает события,
// специфические для графической подсистемы
/*****************************************************************************************/
function GPlayer( sound_system, preflight_time, flight_time, TickManager, cb_LoadProgress )
{
    var gpGlobal = this;

    gpGlobal.sound_system = sound_system; // для извлечения звуков непосредственно из 3D оболочки
    gpGlobal.cbTickManager = TickManager; // коллбэк при самостоятельной анимации
    gpGlobal.cbLoadProgress = cb_LoadProgress; // прогресс загрузки плеера

    var player_3d = new gpVisual( this );
    var player_tabs = new gpTabs( this );

    var gplayer = player_3d;       // активное отображение в данный момент (будет переключаться)

    var speed = 1;

    /*****************************************************************************************/
    // Private
    /*****************************************************************************************/
    /*****************************************************************************************/
    // Public
    /*****************************************************************************************/
    gpGlobal.Init = function( onReady )
    {
        player_3d.Init( onReady );
        player_tabs.Init();
    }
    /*****************************************************************************************/
    gpGlobal.IsAnimating = function() // true если выполняется какая-либо анимация
    {
        if ( typeof gplayer.camera_moving != 'undefined' && gplayer.camera_moving )
            return true;
    }
    /*****************************************************************************************/
    gpGlobal.GetCamera = function ()
    {
        return gplayer.GetCamera();
    }
    /*****************************************************************************************/
    gpGlobal.SetFlightTime = function( ft )
    {
        flight_time = ft;
        gpGlobal.SetSpeed( speed );
    }
    /*****************************************************************************************/
    gpGlobal.SetSpeed = function ( val )
    {
        speed = val;

        gplayer.UpdateNotesPreFlightTime(); // пересчитываем время пролета для каждой подлетающей ноты
        gplayer.SetFlightSpeed( flight_time * speed, flight_time ); // скорость пролета нот мажду грифами
    }
    /*****************************************************************************************/
    gpGlobal.GetSpeed = function()
    {
        return speed;
    }
    /*****************************************************************************************/
    gpGlobal.GetPreFlightTime = function() // время
    {
        return preflight_time * speed;
    }
    /*****************************************************************************************/
    gpGlobal.HasNotes = function()
    {
        return gplayer.HasNotes();
    }
    /*****************************************************************************************/
    gpGlobal.Render = function()
    {
        gplayer.Render();
    }
    /*****************************************************************************************/
    gpGlobal.ClearScene = function()
    {
        gplayer.ClearScene();
    }
    /*****************************************************************************************/
    gpGlobal.BuildScene = function()
    {
        gplayer.BuildScene();
    }
    /*****************************************************************************************/
    gpGlobal.Tick = function( current_tick_size, playing )
    {
        // stats.begin();
        gplayer.Tick( current_tick_size, playing );
        // stats.end();
    }
    /*****************************************************************************************/
    gpGlobal.AddNote = function( note, time_shift )
    {
        gplayer.AddNote( note, time_shift );
    }
    /*****************************************************************************************/
    gpGlobal.GetNotesToPlay = function()
    {
        return gplayer.notes_to_play;
    }
    /*****************************************************************************************/
    gpGlobal.FixCamera = function( bState )
    {
        gplayer.camera_data.camera_fixed = bState;
    }
    /*****************************************************************************************/

}; // gplayer
/*****************************************************************************************/

var tempAlts = {};
var timeline = 0;

// Note struct
function TabNote( pitch_str, delay_sec, duration_sec, beat_size, prev_note_start, string, fret )
{
    // Исходные параметры в секундах
    this.pitch_str = pitch_str;                     // string
    this.pitch = MidiHelper.CalcNote(pitch_str);    // numeric
    this.delay_sec = delay_sec;                     // delay between previous and current note START time
    this.duration_sec = duration_sec;

    this.string = string;
    this.fret = fret;

    // Параметры ноты в долях такта
    this.duration = Math.round( duration_sec / beat_size );
    this.delay = Math.round( delay_sec / beat_size );

    // Начало и конец ноты в долях такта
    this.start = prev_note_start + this.delay;
    this.end   = this.start + this.duration;

    this.ringing = false; // нота звучит в данный момент

    // Поля используемые в визуальном плеере
    this.gpVisual = {
        mesh : null,        // 3D-объект
        visible : false,    // нота отображена на экране
        ringing : false     // нота в стадии звучания
    };

    // Поля используемые в проигрывателе табов
    this.gpTabs = {};
};

/************************************************************************************/

var MidiHelper = {
    CalcNote : function(noteString)
    {
        var note = noteString[0];
        var noteWithOctave = noteString.substring(0, 2); // C2
        var altering = this.GetAltering(noteString);

        // set altering
        if (altering)
            this.SetTempAltering(noteWithOctave, altering);

        // if temporary altering is set - start keys shouldn't be applied
        var note_num = MIDI.keyToNote[noteWithOctave]

        if (tempAlts[noteWithOctave] !== undefined)
            note_num += tempAlts[noteWithOctave];

        return note_num;
    },
    /************************************************************************************/
    GetAltering: function (noteString) {
        var altering = noteString[2];
        return altering !== undefined ? altering : false;
    },
    /************************************************************************************/
    SetTempAltering: function (noteWithOctave, altering) {
        switch (altering) {
            case 'b':
                tempAlts[noteWithOctave] = -1;
                break;
            case '%':
                tempAlts[noteWithOctave] = 0;
                break;
            case '#':
                tempAlts[noteWithOctave] = 1;
                break;
        }
    },
    /************************************************************************************/
    // Похоже эта функция нигде не используется
    Play: function (noteString, delay, duration) {
        var velocity = 127; // how hard the note hits
        var note = CalcNote(noteString);

//                alert(note);

        var start = timeline + delay;
        var stop = start + duration;

//                var speed = 1;
        var speed = 0.7;
//                var speed = 0.5;
//                var speed = 1.5;

        MIDI.noteOn(0, note, velocity, speed * start);
        MIDI.noteOff(0, note, speed * stop);

        timeline += delay;
    },
    /************************************************************************************/
    /************************************************************************************/
};

/**
 * Created by Igor on 10.04.2018.
 */

//******* СТруктра саундфонта
// (21) A0  - метроном
// (22) Bb0 - перкуссия 6-й струны
// (23) B0  - перкуссия 5-й струны
// (24) C1  - перкуссия 4-й струны
// (25) Db1 - перкуссия дискантов

var SoundSystem = function ()
{
    var self = this;

    var strings = [];

    //*****************************************************************************************
    self.Init = function( string_tones )
    {
        strings = string_tones;
    };
    //*****************************************************************************************
    self.PlayMeter = function()
    {
        var pitch = 21; // A0

        MIDI.noteOn( 0, pitch, 15, 0 );
        MIDI.noteOff( 0, pitch, 0 );
    };
    //*****************************************************************************************
    self.PlayNote = function( note, beat, voice, speed )
    {
        var duration = note.gs_total_duration || voice.duration.backbeats; // длительность ноты в бэкбитах

        // note.duration_msec = pointer.GetBackbeatSize() * duration;
        note.duration_msec = beat.backbeat_size * duration;

        // SOUND
        var pitch = strings[note.string - 1].value + note.value;

        // INFO
        // pitch = 40 // E2
        // pitch = 52 // E3  4 - 2
        // pitch = 64 // E4  открятая 1-я
        // pitch = 76 // E5  12-й лад
        // pitch = 83; // B5 19-й лад

        // Перкуссия
        if ( typeof note.effect.deadNote != 'undefined' && note.effect.deadNote )
        {
            PlayPercussion( note );
        }
        else
        // Натуральный флажолет
        if ( typeof note.effect.harmonic != 'undefined' && note.effect.harmonic )
        {
            switch( note.value )
            {
                case 12:
                    break;
                case 7:
                    pitch += 12;
                    break;
            } // switch

            MIDI.noteOn( 0, pitch, note.velocity, 0 );
            MIDI.noteOff( 0, pitch, note.duration_msec * speed / 1000 );
        }
        else
        // Слайд
        if ( typeof note.effect.slide != 'undefined' && note.effect.slide )
        {
            self.PlaySlideNote( note, beat, voice, speed );
        }
        else
        // обычная нота
        {
            MIDI.noteOn( 0, pitch, note.velocity, 0 );
            MIDI.noteOff( 0, pitch, note.duration_msec * speed / 1000 );
        }
    };
    //*****************************************************************************************
    self.PlaySlideNote = function( note, beat, voice, speed ) // вызывается также из gplayer.js
    {
        var duration = note.gs_total_duration || voice.duration.backbeats; // длительность ноты в бэкбитах
        note.duration_msec = duration * beat.backbeat_size;
        velocity = note.velocity;

        var fret_distance = Math.abs( note.value - note.effect.slide.current_fret );

        

        // Определяем громкость звука, в зависимости от количество пройденных ладов
        velocity = velocity - fret_distance * 10; // нужна более продуманная параметрическая функция

        duration = duration / ( Math.abs( note.effect.slide.next_fret - note.value ) + 1 ); // длительность звучания текущего лада в слайде
        var duration_msec = duration * beat.backbeat_size;

        // SOUND
        var pitch = strings[note.string - 1].value + note.effect.slide.current_fret;

        MIDI.noteOn( 0, pitch, velocity, 0 );
        MIDI.noteOff( 0, pitch, duration_msec * speed / 1000 );
    }
    //*****************************************************************************************
    function PlayPercussion ( note )
    {
        var pitch = 22; // дисканты

        switch (note.string)
        {
            case 6:
                pitch = 23;
                break;
            case 5:
                pitch = 24;
                break;
            case 4:
                pitch = 25;
                break;
        }

        MIDI.noteOn( 0, pitch, 60, 0 );
        MIDI.noteOff( 0, pitch, 0 );
    }
    //*****************************************************************************************

    //*****************************************************************************************
};

// структура с индексами бита
var BeatLocation = function( measure_idx, beat_idx )
{
    var self = this;

    self.measure_idx = measure_idx || 0;
    self.beat_idx = beat_idx || 0;

    self.Clone = function()
    {
        return new BeatLocation( self.measure_idx, self.beat_idx );
    };
    //*****************************************************************************************
    self.IsAtStartPoint = function()
    {
        if ( self.measure_idx == 0 && self.beat_idx == 0 )
            return true;
        else
            return false
    };
    //*****************************************************************************************
    self.Copy = function ( location )
    {
        self.measure_idx = location.measure_idx;
        self.beat_idx = location.beat_idx;
    };
    //*****************************************************************************************
};

//****************************  TABS POINTER  ********************************************

// Набор указателей внутри структуры Guitar Pro
var TabsPointer = function( preflight_time )
{
    var self = this;
    var tabs = null;

    var current_beat = null;
    var next_beat = null;

    var current_tempo = null; // темп текущего такта
    var notes_flight_time = 0;   // время пролета нот между грифами (мсек)
    var notes_preflight_time = preflight_time; // время появления нот перед пролетом

    var next_measure_start = 0;  // следующий такт в бэкбитах
    var next_beat_start = 0;     // следующий бит в бэкбитах

    self.has_next_beat = true;

    self.backbeat = 0;      // номер текущего бэкбита
    self.note_end_bb = 0;   // бэкбит на котором завершается звучание текущей ноты
    var backbeat_time = 0;  // суммарное время прошедшее с начала текущего бэкбита ( tick может быть меньше бэкбита )

    var meter_size = 16;        // размер доли для метронома
    var prev_meter_backbeat = 0;    // предыдущий удар метронома в бэкбитах

    self.isSet = false;

    self.beats_to_play = []; // текущие ноты, которые должны прозвучать

    //*****************************************************************************************
    self.Init = function( gp_tabs )
    {
        tabs = gp_tabs;

        current_beat = new BeatLocation( 0, 0, 0 );
        next_beat = new BeatLocation( 0, 0, 0 );

        current_tempo = null; // темп текущего такта
        notes_flight_time = 0;   // время пролета нот между грифами (мсек)
        notes_preflight_time = preflight_time; // время появления нот перед пролетом

        next_measure_start = 0;  // следующий такт в бэкбитах
        next_beat_start = 0;     // следующий бит в бэкбитах

        self.has_next_beat = true;

        self.backbeat = 0;      // номер текущего бэкбита
        self.note_end_bb = 0;   // бэкбит на котором завершается звучание текущей ноты
        backbeat_time = 0;  // суммарное время прошедшее с начала текущего бэкбита ( tick может быть меньше бэкбита )

        self.isSet = false;

        self.beats_to_play = []; // текущие ноты, которые должны прозвучать

        InitLocalData();

        // определяем время полета нот
        // TODO : количество нот между грифами (скорость пролета) должно варьироваться, в зависимости от кучности нот
        var max_tempo = self.FindFastestMeasure(); // Ищем самый быстрый такт
        notes_flight_time = max_tempo.msec * 4;
        // notes_flight_time = max_tempo.msec * 8;

        FindNextBeat();
    };
    //*****************************************************************************************
    self.Set = function( backbeat_idx, delta_shift )
    {
        delta_shift = delta_shift || 0; // показывает насколько нужно сдвинуть ноты после их вывода на экран
        var measure_found = false;
        var beat_found = false;

        var measures = tabs.tracks[0].measures;

        // Поиск такта
        var idx = SearchBackbeatPos( backbeat_idx, measures );
        var measure = measures[idx];
        current_beat.measure_idx = idx; // save index

        SetCurrentTempo();

        var beats = measure.beats;

        // Поиск бита
        idx = SearchBackbeatPos( backbeat_idx, beats );
        var beat = beats[idx];
        current_beat.beat_idx = idx; // save index
        self.backbeat = backbeat_idx;

        self.beats_to_play.length = 0; // на всякий случай очищаем массив

        DisplayPrevNotes( delta_shift ); // выводим предыдущие ноты в пространстве нот

        // Параметры метронома
        var measure = self.GetMeasureData( current_beat );
        meter_size = 64 / measure.header.timeSignature.denominator.value;
        prev_meter_backbeat = self.backbeat;

        self.has_next_beat = FindNextBeat();
        self.isSet = true;

        return self.backbeat;
    };
    //*****************************************************************************************
    self.GetStrings = function()
    {
        return tabs.tracks[0].strings;
    };
    //*****************************************************************************************
    self.GetBackbeatSize = function(  )
    {
        return current_tempo.backbeat_size;
    };
    //*****************************************************************************************
    self.GetBeatTempo = function( location )
    {
        var tempo = tabs.tracks[0].measures[location.measure_idx].header.tempo;
            tempo.backbeat_size = tempo.msec / 16; // 64-я доля такта

        return tempo;
    };
    //*****************************************************************************************
    self.GetNotesFlightTime = function()
    {
        return notes_flight_time;
    };
    //*****************************************************************************************
    self.GetTotalBackbeats = function()
    {
        return tabs.tracks[0].total_backbeats || 0;
    };
    //*****************************************************************************************
    self.FindFastestMeasure = function() // поиск такта с самым быстрым темпом
    {
        var fastest_tempo = tabs.tracks[0].measures[0].header.tempo;

        for ( var i = 1; i < tabs.tracks[0].measures.length; i++ )
        {
            var tempo = tabs.tracks[0].measures[i].header.tempo;

            if ( tempo.value > fastest_tempo.value )
                fastest_tempo = tempo;
        }

        return fastest_tempo;
    };
    //*****************************************************************************************
    self.FindBackbeatData = function( backbeat ) // поиск последней ноты до указанного бэкбита
    {
        var beat_location = self.LocateBeat( backbeat );
        return self.GetBeatData( beat_location );
    };
    //*****************************************************************************************
    self.LocateBeat = function( backbeat, next_one ) // поиск бита в табах
    {
        var measures = tabs.tracks[0].measures; // берем такты

        // Поиск такта
        var measure_id = SearchBackbeatPos( backbeat, measures );
        var measure = measures[measure_id]; // достаем нужный такт

        var beats = measure.beats; // биты в такте

        // Поиск бита
        var beat_idx = SearchBackbeatPos( backbeat, beats );

        var location = new BeatLocation( measure_id, beat_idx );

        if ( typeof next_one != 'undefined' && next_one &&   // если нужно определить следующий бит
             backbeat > self.GetBeatData( location ).start ) // за неполным текущим
            LocateNextBeat( location );

        return location;
    };
    //*****************************************************************************************
    self.FindBackbeatBackward = function( time_shift ) // поиск бэкбита со смещением по времени
    {
        var location = current_beat.Clone();
        var first_beat = true;

        do
        {
            var beat = self.GetBeatData( location );
            var tempo = self.GetBeatTempo( location );

            if ( first_beat )
            {
                time_shift -= ( self.backbeat - beat.start ) * tempo.backbeat_size;
                first_beat = false;
            }
            else
                time_shift -= beat.duration_to_next * tempo.backbeat_size; // длительность бита в секундах

            if ( time_shift <= 0 ) // если выходим за границы
                break;

        } while( LocatePrevBeat( location ) ); // Предыдущий бит

        return self.GetBeatData( location ).start;
    };
    //*****************************************************************************************
    self.GetMeasureData = function ( beat_location )
    {
        return tabs.tracks[0].measures[ beat_location.measure_idx ];
    };
    //*****************************************************************************************
    self.GetBeatData = function( beat_location )
    {
        return tabs.tracks[0].measures[ beat_location.measure_idx ].beats[ beat_location.beat_idx ];
    };
    //*****************************************************************************************
    self.GetVoiceData = function ( beat_location, voice_idx )
    {
        return tabs.tracks[0].measures[ beat_location.measure_idx ].beats[ beat_location.beat_idx ].voices[ voice_idx ];
    };
    //*****************************************************************************************
    self.FindStripData = function( beat_location, strip_start ) // ищет ближайшие данные о дорожке (начало или конец)
    {
        var beat = self.GetBeatData( beat_location );
        var strip = false;

        if ( beat )
        {
            strip = strip_start ? beat.strip_start : beat.strip_end;

            // Если текущий бит НЕ содержит нужные данные
            if ( typeof strip == 'undefined' )
            {
                // ищем дальше
                if ( strip_start ) // начало дорожки
                    LocatePrevBeat( beat_location );
                else // ищем конец дорожки
                    LocateNextBeat( beat_location );

                return self.FindStripData( beat_location, strip_start ); // РЕКУРСИВНО
            }
        }

        return strip;
    };
    //*****************************************************************************************
    self.SetBeatStrip = function (beat, strip_data, strip_start, active )
    {
        if ( typeof active == 'undefined' )
            active = true;

        if ( strip_start )
        {
            beat.local_data.strip_start.fret_min = strip_data.fret_min; // копируем данные дорожки
            beat.local_data.strip_start.fret_max = strip_data.fret_max;
            beat.local_data.strip_start.active = active; // выставляем флаг, чтобы данные были использованы
            beat.local_data.strip_start.in_flight = active; // этот флаг будет сброшен по прилету дорожки на ближний гриф
        }
        else
        {
            beat.local_data.strip_end.fret_min = strip_data.fret_min;
            beat.local_data.strip_end.fret_max = strip_data.fret_max;
            beat.local_data.strip_end.active = active;
        }
    };
    //*****************************************************************************************
    self.NewTick = function( current_tick_size, speed ) // след БЭКБИТ
    {
        var time_left = 0;
        var beats = []; // прошедшие бэкбиты

        var backbeat_size = current_tempo.backbeat_size * speed;
        backbeat_time += current_tick_size;

        //
        //

        // считаем количество прошедших бэкбитов и сохраняем их в массиве
        while( backbeat_time >= backbeat_size ) // произошел ли переход в след. бэкбит относительно времени
        {
            //

            backbeat_time -= backbeat_size; // сброс аккумулятора

            // если еще есть ноты
            if ( self.has_next_beat )
            {
                // Смешение указателя в табах
                NewBackbeat();

                // если кратно шагу метронома, то добавляем метроном
                var measure = self.GetMeasureData( current_beat ); // текущий  такт

                if ( self.backbeat > prev_meter_backbeat && ( self.backbeat - measure.start ) % meter_size == false )
                    AddMeterToPlay();
            }
            else // если проигрывать больше нечего
            if ( self.backbeat >= tabs.tracks[0].total_backbeats )
                self.isSet = false;

            self.backbeat++;
        }
    };
    //*****************************************************************************************
    function InitLocalData()
    {
        var measures = tabs.tracks[0].measures;
        for ( var i = 0; i < measures.length; i++ )
        {
            var beats = measures[i].beats;

            for ( var j = 0; j < beats.length; j++ )
            {
                beats[j].local_data = {
                    strip_start : {
                        fret_min : 0,
                        fret_max : 0,
                        active : false  // показывает, нужно ли учитывать данные дорожки в этом бите
                    },
                    strip_end : {
                        fret_min : 0,
                        fret_max : 0,
                        active : false  // показывает, нужно ли учитывать данные дорожки в этом бите
                    }
                };

                var voices = beats[j].voices;

                for ( var k = 0; k < voices.length; k++ )
                {
                    var notes = voices[k].notes;

                    for ( var l = 0; l < notes.length; l++ )
                    {
                        var note = notes[l];
                        var visible = false;

                        if ( typeof note.tiedNote == 'undefined' || note.tiedNote == false )
                            visible = true;

                        note.local_data = {
                            visible : visible,
                            sound_time : 0, // аккумулятор времени звучания ноты
                            mesh : null
                        }
                    } // notes
                } // voices
            } // beats
        } // measures
    }
    //*****************************************************************************************
    // Ищет индекс такта в произведении или индекс бита в такте
    function SearchBackbeatPos( backbeat, array )
    {
        var measure_found = false;

        for ( var i = 0; i < array.length; i++ ) // ищем такт
        {
            var measure = array[i];

            // такт найден
            if ( measure.start >= backbeat )
            {
                if ( measure.start > backbeat ) // найден следующий такт
                    i--; // берем предыдущий такт

                measure_found = true;
                break;
            }
        } // поиск такта

        if ( measure_found == false ) // если значение бэкбита слишком большое
            i = array.length - 1;  // берем последний такт

        return i;
    }
    //*****************************************************************************************
    function LocatePrevBeat( beat_location )
    {
        var found = false;

        // если это первый бит в такте
        if ( beat_location.beat_idx == 0 )
        {
            // берем предыдущий такт
            if ( beat_location.measure_idx > 0 )
            {
                beat_location.measure_idx--;
                beat_location.beat_idx = tabs.tracks[0].measures[beat_location.measure_idx].beats.length - 1; // последний бит в такте
                found = true;
            }
        }
        else
        {
            beat_location.beat_idx--;
            found = true;
        }

        return found;
    }
    //*****************************************************************************************
    function LocateNextBeat( beat_location )
    {
        var measures = tabs.tracks[0].measures;
        var beats = measures[beat_location.measure_idx].beats;
        var found = true;

        if ( beat_location.beat_idx < beats.length - 1 ) // если есть еще биты в текущем такте
        {
            beat_location.beat_idx++;
        }
        else // биты закончились, берем следующий такт
        {
            // если есть еще такты
            if ( beat_location.measure_idx < measures.length - 1 )
            {
                beat_location.measure_idx++;

                // если в такте есть биты
                if ( measures[beat_location.measure_idx].beats.length > 0 )
                {
                    beats = measures[beat_location.measure_idx].beats;
                    beat_location.beat_idx = 0;
                }
                else
                    found = false; // в следующем такте отстутсвуют биты
            }
            else
                found = false; // такты закончились
        }

        return found;
    }
    //*****************************************************************************************
    function SetCurrentTempo()
    {
        current_tempo = self.GetBeatTempo( current_beat );
    }
    //*****************************************************************************************
    function NewBackbeat()
    {
        // Определяем биты
        if ( self.backbeat >= next_beat_start && self.has_next_beat )
        {
            // смещаем указатели
            NewBeat();

            // определяем текущие ноты
            AddBeatToPlay();
        }
    }
    //*****************************************************************************************
    function NewBeat()
    {
        if ( next_beat.measure_idx != -1 && next_beat.beat_idx != -1 )
        {
            // Если начало нового такта
            if ( next_beat.measure_idx != current_beat.measure_idx )
            {
                var measure = self.GetMeasureData( next_beat );

                // Сохраняем текущий размер такта
                meter_size = 64 / measure.header.timeSignature.denominator.value;
            }

            current_beat.measure_idx = next_beat.measure_idx;
            current_beat.beat_idx = next_beat.beat_idx;
            SetCurrentTempo();

            self.has_next_beat = FindNextBeat();
        }
    }
    //*****************************************************************************************
    function FindNextBeat() // out params
    {
        var found = false;
        var beat_location = current_beat.Clone();

        if ( LocateNextBeat( beat_location )) // если бит найден
        {
            var beat = self.GetBeatData( beat_location );
            var measure = self.GetMeasureData( beat_location );

            next_beat = beat_location;
            next_measure_start =  measure.start;
            next_beat_start = beat.start;

            found = true;
        }
        else
        {
            next_measure_start = -1;
            next_beat_start = -1;
        }

        return found;
    }
    //*****************************************************************************************
    function AddMeterToPlay( time_shift )
    {
        if ( typeof time_shift == 'undefined' )
            time_shift = backbeat_time; // сдвиг ноты по времени

        var beat = {
            meter: true,
            start: self.backbeat, // не используется при выводе нот
            time_shift: time_shift,
            voices: []
        };

        self.beats_to_play.push( beat );

        prev_meter_backbeat = self.backbeat;
    }
    //*****************************************************************************************
    function AddBeatToPlay( location, time_shift )
    {
        location = location || current_beat;

        if ( typeof time_shift == 'undefined' )
            time_shift = backbeat_time; // сдвиг ноты по времени

        var beat = self.GetBeatData( location );

        beat.time_shift = time_shift; // именно на столько нужно будет продвинуть летящие ноты вперед
        beat.backbeat_size = beat.backbeat_size ? beat.backbeat_size : self.GetBeatTempo( location ).backbeat_size;

        self.beats_to_play.push( beat );
    }
    //*****************************************************************************************
    // Вывод предыдущих битов, чтобы заполнить пространство нот между грифами (используется при перемотке)
    function DisplayPrevNotes( delta_shift )
    {
        delta_shift = delta_shift || 0; // показывает насколько нужно сдвинуть ноты после их вывода на экран
        var location = current_beat.Clone();
        var time_shift = 0;
        var first_beat_location = new BeatLocation();
        var first_beat = true; // первый проход
        var max_time_shift = notes_flight_time * 0.95 + notes_preflight_time - delta_shift;
        var prev_backbeat = self.backbeat;
        var prev_time_shift = 0;

        var meter_time_shift = 0; // используется в FindAndSaveMeter()

        // данные текущей нот
        var beat = null;
        var measure = null;
        var tempo = null;

        var beats = [];     // массив битов
        var meters = [];    // массив меток метронома

        // Заполняем массив в обратном направлении
        do
        {
            beat = self.GetBeatData( location );
            measure = self.GetMeasureData( location ); // текущий такт
            tempo = self.GetBeatTempo( location );

            if ( typeof beat == 'undefined' ) // что-то не то с указателем
                return;

            // считаем абсолютное смещение
            if ( first_beat )
                time_shift = ( self.backbeat - beat.start ) * tempo.backbeat_size;
            else
                time_shift += beat.duration_to_next * tempo.backbeat_size; // длительность бита в секундах

            if ( time_shift > max_time_shift ) // если выходим за границы
                break;

            // рассчитываем и сохраняем метроном
            CompileMeter( beat.start, prev_backbeat, measure, time_shift - prev_time_shift, tempo.backbeat_size );

            // Сохраняем бит
            AddBeatToQueue( beat, tempo, time_shift );

            prev_backbeat = beat.start;
            prev_time_shift = time_shift;
            first_beat_location.Copy( location );
            first_beat = false;

        }while( LocatePrevBeat( location ) ); // Предыдущий бит

        // Объединяем биты и метки метронома
        MergeBeatsAndMeter();

        self.beats_to_play.reverse();

        // Присваиваем стартовую дорожку первому биту
        if ( self.beats_to_play.length > 0 )
        {
            var strip_start = self.FindStripData( first_beat_location, true );
            var beat = self.beats_to_play[0];
            self.SetBeatStrip( beat, strip_start, true );
        }

        //-----------------------------------------------------------------------------
        function AddBeatToQueue( beat, tempo, time_shift )
        {
            beat.backbeat_size = beat.backbeat_size ? beat.backbeat_size : self.GetBeatTempo( location ).backbeat_size;

            if ( first_beat )
            {
                beat.time_shift = time_shift;
                beats.push( beat );
            }
            else
            {
                beat.time_shift = beat.duration_to_next * tempo.backbeat_size;
                beats.push( beat );
            }
        } // AddBeatToQueue
        //-----------------------------------------------------------------------------
        function CompileMeter( backbeat1, backbeat2, measure, beat_time, backbeat_size )
        {
            var backbeat = backbeat2;
            var meter_size = 64 / measure.header.timeSignature.denominator.value;

            var rest = ( backbeat - measure.start ) % meter_size; // остаток после первого бэкбита

            var shift_once = true;
            if ( backbeat - rest < backbeat1 ) // если выходим за пределы интервала, то надо сохранить смещение для след. интервала
            {
                meter_time_shift += ( backbeat - backbeat1 ) * backbeat_size;
                shift_once = false;
            }

            if ( rest == 0 )
                rest = meter_size;

            if ( backbeat - rest < backbeat1 && shift_once ) // если выходим за пределы интервала, то надо сохранить смещение для след. интервала
                meter_time_shift += ( backbeat - backbeat1 ) * backbeat_size;

            if ( backbeat > 0 )
                backbeat -= rest;

            while( backbeat >= backbeat1 ) // пока укладывается в промежуток
            {
                meter_time_shift += rest * backbeat_size;

                var beat = {
                    meter: true,
                    start: backbeat, // не используется при выводе нот
                    time_shift: meter_time_shift,
                    voices: []
                };

                if ( backbeat1 == 0 && backbeat2 == 0 ) // первый бит в треке
                    beat.time_shift = 0;

                meters.push( beat );

                if ( beat.start > backbeat1 && beat.start - backbeat1 < meter_size ) // если остается бэкбит перед меткой метронома
                    meter_time_shift = ( beat.start - backbeat1 ) * backbeat_size;
                else
                    meter_time_shift = 0;

                rest = meter_size;
                backbeat -= rest;
            }
        } // CompileMeter
        //-----------------------------------------------------------------------------
        function MergeBeatsAndMeter()
        {
            if ( meters.length == 0 )
            {
                self.beats_to_play = beats;
                return;
            }

            var beat_idx = 0;
            var meter_idx = 0;

            while( beat_idx < beats.length || meter_idx < meters.length )
            {
                var beat = beats[beat_idx];
                var meter = meters[meter_idx];

                if ( typeof meter == 'undefined' )
                {
                    self.beats_to_play.push( beat );
                    beat_idx++;
                    continue;
                }

                if ( beat.start == meter.start )
                {
                    beat.time_shift = 0;

                    self.beats_to_play.push( meter );
                    self.beats_to_play.push( beat );

                    beat_idx++;
                    meter_idx++;
                }
                else
                if ( beat.start > meter.start )
                {
                    meter.time_shift -= beat.time_shift;
                    self.beats_to_play.push( beat );
                    beat_idx++;
                }
                else
                if ( beat.start < meter.start )
                {
                    beat.time_shift -= meter.time_shift;
                    self.beats_to_play.push( meter );
                    meter_idx++;
                }

            } // while
        } // MergeBeatsAndMeter
        //-----------------------------------------------------------------------------
    }
    //*****************************************************************************************
};

//*****************************  Player  **************************************************
var Player = function( cb_LoadProgress )
{
    var self = this;
    var current_tabs = null;    // проигрываемые в данный момент табы
    var gplayer = null; // графическая оболочка

    var sound_system = new SoundSystem();

    self.is_ready = false;  // становится true, когда всё загружено и запущено

    self.playing = false;   // происходит ли проигрывание в данный момент
    self.ticking = false;   // продолжается ли генерация тиков

    var current_notes = [];     // notes ringing at the moment ( пока нигде не используется )
    var volume = 40;            // 127 максимально
    var speed = 1;              // скорость воспроизведения ( коэффициент )
    var metronome = false;      // включен ли метроном

    // Ticks
    var tick_timeout = null;     // setTimeout() result handler
    var tick_size = 10;          // msec
    var tick_timestamp = 0;      // Засечка времени для тика

    // Текущие указатели в табах Guitar Pro
    var pointer = null; // текущий указатель табов

    // ВременнЫе переменные
    var beat_time = 0;           // время в миллисекундах, прошедшее от начала текущей доли
    var preflight_time = 1000;   // время перед полетом ноты

    // Loop
    var loop = false;
    var loop_solid = false;      // показывает, должна ли быть пауза между повторениями
    var loop_start_backbeat = 0;    // начало фрагмента
    var loop_end_backbeat = 0;      // последняя нота фрагмента не обязательно приходятся точно на биты в табах
    var loop_end_location = null;
    var loop_end_beat = null;       // структура с данными бита из табов
    var loop_end_strip = null;      // и в конце фрагмента

    var meter_enabled = false;              // состояние метронома

    // CALLBACKS
    self.cb_Beat = function(){};        // Вызываетеся на каждом бите (GP); передает прогрес ( и текущие ноты )
    self.cb_PlayPause = function(){};   // Вызывается, при автоматическиом останове / запуске проигрывания

    self.cb_LoadProgress = cb_LoadProgress; // вызывается из 3D-модуля для передачи прогресса загрузки
    
    //*****************************************************************************************
    self.Init = function( onReady )
    {
        // Звук
        MIDI.programChange(0, MIDI.GM.byName["acoustic_guitar_nylon"].number);
        MIDI.setVolume(0, volume);

        // 3D-PLAYER
        if ( gplayer == null )
        {
            gplayer = new GPlayer(
                sound_system,
                preflight_time,
                0,
                self.TickManager,
                self.cb_LoadProgress );
            gplayer.Init( function( result )
            {
                if ( result )
                    self.is_ready = true;
                else
                    gplayer = null;

                onReady( result ); // возвращаем управление оболочке
            });
        }
        else
            onReady( true );
    };
    //*****************************************************************************************
    self.InitTabs = function( tabs, onReady )
    {
        current_tabs = tabs;

        if ( pointer == null )
            pointer = new TabsPointer( preflight_time );

        try
        {
            tabs = JSON.parse( tabs );
            pointer.Init( tabs );
        }
        catch( e )
        {
            return false;
        }

        // Sound System
        sound_system.Init( pointer.GetStrings() );

        gplayer.SetFlightTime( pointer.GetNotesFlightTime());

        return true;
    };
    //*****************************************************************************************
    self.InitState = function()
    {
        // self.SetSpeed( 100 );
        //
        // // Loop  (полностью всё произведение)
        // self.SetLoopStart(0);
        // self.SetLoopEnd( pointer.GetTotalBackbeats());
        // // self.SetCurrentBeat(0);
        // self.SetCurrentBeat(1000); // FOR TEST

        gplayer.Tick( 0, true ); // просто отображаем на экране ноты, без смещения
    };
    //*****************************************************************************************
    self.SetVolume = function( vol )
    {
        volume = vol;
        MIDI.setVolume( 0, volume );
    };
    //*****************************************************************************************
    self.EnableRepeat = function( enable ) // boolean
    {
        loop = enable;
    };
    //*****************************************************************************************
    self.EnableMeter = function( enable ) // boolean
    {
        meter_enabled = enable;
    };
    //*****************************************************************************************
    // Скорость задается как коэффициент от темпа ( от 0 до 100 )
    self.SetSpeed = function( val )
    {
        var max_times = 5;

        speed = max_times - (max_times - 1) * val / 100;

        gplayer.SetSpeed( speed );
    };
    //*****************************************************************************************
    self.Play = function()
    {
        tick_timestamp = new Date().getTime(); // now
        self.playing = true;
        self.TickManager();

        
    };
    //*****************************************************************************************
    self.Pause = function()
    {
        self.playing = false;
        self.TickManager();

        

        MIDI.stopAllNotes();
    };
    //*****************************************************************************************
    self.PlayPause = function()
    {
        if ( self.playing )
            self.Pause();
        else
            self.Play();
    };
    //*****************************************************************************************
    self.GetTotalBackbeats = function()
    {
        return pointer.GetTotalBackbeats();
    };
    //*****************************************************************************************
    self.GetCurrentBackbeat = function()
    {
        return pointer.backbeat;
    };
    //*****************************************************************************************
    self.SetLoopStart = function( backbeat, set_current_beat )
    {
        if ( typeof set_current_beat == 'undefined' )
            set_current_beat = true;

        loop_start_backbeat = backbeat;

        if ( set_current_beat )
            self.SetCurrentBeat( loop_start_backbeat );

        
    };
    //*****************************************************************************************
    self.SetLoopEnd = function( backbeat, set_current_beat, shift_pointer )
    {
        shift_pointer = shift_pointer || false;  // сдвигать указатель на расстояние preflight_time
        if ( typeof set_current_beat == 'undefined' )
            set_current_beat = true;

        // убираем маркер конца дорожки предыдущего фрагмента
        if ( loop_end_beat && loop_end_beat.local_data.strip_end.active == true )
            pointer.SetBeatStrip( loop_end_beat, loop_end_strip, false, false );

        if ( shift_pointer )
        {
            backbeat = pointer.FindBackbeatBackward( preflight_time );

            if ( backbeat < loop_start_backbeat ) // если меньше левой границы
                backbeat = loop_start_backbeat;
        }

        loop_end_backbeat = backbeat;
        loop_end_location = pointer.LocateBeat( loop_end_backbeat, false );
        loop_end_beat = pointer.GetBeatData( loop_end_location );
        loop_end_strip = pointer.FindStripData( loop_end_location, false );

        if ( set_current_beat )
            self.SetCurrentBeat( backbeat, preflight_time );

        

        return backbeat;
    };
    //*****************************************************************************************
    self.SetLoopSolid = function ( solid )
    {
        loop_solid = solid;
    };
    //*****************************************************************************************
    self.PlayFromStart = function ()
    {
        self.SetCurrentBeat( loop_start_backbeat );
    };
    //*****************************************************************************************
    self.SetCurrentBeat = function( backbeat, delta_shift )
    {
        delta_shift = delta_shift || 0; // показывает насколько нужно сдвинуть ноты после их вывода на экран
        

        // возвращаем внутрь врагмента если указатель выходит за его пределы
        if ( backbeat < loop_start_backbeat )
            backbeat = loop_start_backbeat;
        else
        if ( backbeat > loop_end_backbeat )
            backbeat = loop_end_backbeat;

        pointer.Set( backbeat, delta_shift );

        gplayer.ClearScene();
        ClearCurrentNotes();

        DisplayNotes( pointer, gplayer.AddNote, true, delta_shift );
        gplayer.Tick( delta_shift, true ); // просто отображаем на экране ноты, без смещения

        self.cb_Beat( pointer.backbeat, [] );
    };
    //*****************************************************************************************
    // Определяет нужно ли генерироваьт тики или нет
    self.TickManager = function()
    {
        if ( self.playing || gplayer.IsAnimating()) // нужны тики
        {
            if ( self.ticking == false ) // меняем состояние
            {
                self.ticking = true;
                Tick( self ); // RUN
            }
        }
        else // тики не нужны
        {
            if ( self.ticking )
            {
                clearTimeout( tick_timeout );
                self.ticking = false;
            }
        }
    };
    //*****************************************************************************************
    // ОСНОВНОЙ ТАКТОВЫЙ ГЕНЕРАТОР
    function Tick( self )
    {
        self.Tick();
    }
    //*****************************************************************************************
    self.Tick = function ()
    {
        if ( self.ticking )
        {
            if ( self.playing )
            {
                // Размер текущего тика
                var now = new Date().getTime();
                var current_tick_size = now - tick_timestamp;
                tick_timestamp = now;

                // 

                // Проверяем конечную точку воспроизведения
                if ( pointer.backbeat <= loop_end_backbeat )
                {
                    // Смещение указателя
                    pointer.NewTick(current_tick_size, speed);

                    // Вызов коллбэка для отображения прогресса
                    self.cb_Beat( pointer.backbeat, [] );
                }
                else // конечная точка достигнута
                {
                    if ( loop && loop_solid ) // если закольцовано и между повторениями не должно быть паузы
                    {
                        self.SetCurrentBeat( loop_start_backbeat );

                        // Вызов коллбэка для отображения прогресса
                        self.cb_Beat( pointer.backbeat, [] );
                    }
                    else
                    // Проверяем состояние 3D-проигрывателя
                    if ( gplayer.HasNotes() == false ) // если ноты закончились и все были проиграны
                    {
                        if ( loop ) // если закольцовано
                        {
                            self.SetCurrentBeat( loop_start_backbeat );

                            // Вызов коллбэка для отображения прогресса
                            self.cb_Beat( pointer.backbeat, [] );
                        }
                        else // loop is OFF
                        {
                            self.cb_PlayPause(); // change the play/pause button view
                            self.SetCurrentBeat( loop_start_backbeat );

                            // Вызов коллбэка для отображения прогресса
                            self.cb_Beat( pointer.backbeat, [] );
                        }
                    }
                }

                // Анимация кадра
                gplayer.Tick( current_tick_size, self.playing );

                // Проверяем есть ли ноты для проигрывания
                PlayNotes();
                DisplayNotes( pointer, gplayer.AddNote );
            } // if playing
            else
            {
                // Анимация кадра
                gplayer.Tick( current_tick_size, self.playing );
            }

            // Next tick request
            tick_timeout = setTimeout( Tick, tick_size, self );

        } // if ticking
    };
    //*****************************************************************************************
    function ClearCurrentNotes()
    {
        current_notes.length = 0;
    }
    //*****************************************************************************************
    function PlayNotes()
    {
        var beats = gplayer.GetNotesToPlay();

        // Перебираем текущие ноты из 3D проигрывателя
        for ( var i = 0; i < beats.length; i++ )
        {
            PlayNote( beats[i] ); // проигрывание ноты
        }

        beats.length = 0;
    }
    //*****************************************************************************************
    function DisplayNotes( pointer, cbDisplayNote, rewind )
    {
        if ( typeof rewind == 'undefined' )
            rewind = false;

        cbDisplayNote = cbDisplayNote || false;

        var beats = pointer.beats_to_play;

        // перебираем биты
        for ( var i = 0; i < beats.length; i++ )
        {
            var beat = beats[i];

            // Данные летящих дорожек
            var strip_start = null;
            var strip_end = null;

            // стандартные дорожки
            if ( typeof beat.strip_start != 'undefined' )
                pointer.SetBeatStrip( beat, beat.strip_start, true );

            if ( typeof beat.strip_end != 'undefined' )
                pointer.SetBeatStrip( beat, beat.strip_end, false );

            // внеочередные границы дорожек в конце фрагмента
            if ( loop_end_beat && beat.start == loop_end_beat.start && beat.meter == 'undefined' )   // если это последняя нота фрагмента
                pointer.SetBeatStrip( beat, loop_end_strip, false );

            if ( rewind ) // ПЕРЕМОТКА
            {
                gplayer.FixCamera( true );
                    cbDisplayNote( beat, 0 ); // добавляем ноту без смещения
                gplayer.FixCamera( false );

                // проталкиваем ноты в пространстве между грифами
                if ( beat.time_shift > 0 )
                    gplayer.Tick(( beat.time_shift ) * speed, true );
            }
            else // воспроизведение
                cbDisplayNote( beat, beat.time_shift * speed );

        } // for beats

        pointer.beats_to_play.length = 0; // каждый раз очищаем
    }
    //*****************************************************************************************
    function PlayNote( beat )
    {
        // метроном
        if ( typeof beat.meter != 'undefined' && meter_enabled )
        {
            sound_system.PlayMeter();
        }

        // Перебираем голоса
        for ( var i = 0; i < beat.voices.length; i++ )
        {
            var voice = beat.voices[i];

            // перебираем ноты
            for ( var j = 0; j < voice.notes.length; j++ )
            {
                var note = voice.notes[j];

                if ( note.local_data.visible )
                {
                    sound_system.PlayNote( note, beat, voice, speed );
                }
            } // for notes
        }
    }
    //*****************************************************************************************
};



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
        //
    }
    /********************************************************************************/
};
// Guitar Midi Player interface implementation
//
// ATTENTION!!!
// Callback functions which may get called from the player class
// are marked with "GUI_" prefix

//*************************************************************************************
// Init
function PlayerGUI()
{
    var self = this;
    var player = null;

    // Параметры управления
    var params = {
        volume : null,
        speed : null,
        loop_start : null,
        loop_end : null,
        loop_repeat : false,
        meter : false
    };

    var local_storage_name = {
        volume : 'player_volume',
        speed : 'player_speed',
        loop_start : 'player_loop_start',
        loop_end : 'player_loop_end',
        loop_repeat : 'player_loop_repeat',
        meter : 'player_meter'
    };

    var controls = {
        volume : $( "#slider-volume" ),
        speed : $( "#slider-tempo" ),
        progress : $( "#slider-progress" ),
        range : $( "#slider-range" ), // двойной ползунок фрагмента
        loop_start : $('.player_controls .button.loop_bounds.start'),
        loop_end : $('.player_controls .button.loop_bounds.end'),
    };

    var is_full_screen = false;

    var load_progress = null;
    var load_progress_label = null;

    var alrt = $('.player_container .alert-wrapper');

    //*************************************************************************************
    self.InitPlayerInterface = function( Player, curr_song_is_set /*=false*/ )
    {
        player = Player;

        LoadParamsFromStorage( curr_song_is_set );

        // Range slider
        controls.range.slider({
            range: true,
            min: 0,
            max: player.GetTotalBackbeats(),
            values: [ params.loop_start, params.loop_end ],
            slide: function( event, ui )
            {
                if ( ui.values[0] != params.loop_start )
                {
                    SetLoopStart( ui.values[0] );
                }
                if ( ui.values[1] != params.loop_end )
                {
                    SetLoopEnd( ui.values[1], true, false );
                }
            }
        });

        // Progress slider
        controls.progress.slider({
            range: "min",
            value: params.loop_start,
            min: 0,
            max: player.GetTotalBackbeats(),
            slide: function( event, ui ){
                player.SetCurrentBeat( ui.value );
            }
        });

        // Volume
        controls.volume.slider({
            orientation: "vertical",
            min: 1,
            max: 128,
            value: params.volume,
            slide: function( event, ui ){
                player.SetVolume( ui.value - 1 );
                params.volume = ui.value;
                window.localStorage.setItem( local_storage_name.volume, params.volume );
            }
        });

        // Speed
        controls.speed.slider({
            orientation: "vertical",
            min: 0,
            max: 100,
            value: params.speed,
            slide: function( event, ui ){
                player.SetSpeed( ui.value );
                params.speed = ui.value;
                window.localStorage.setItem( local_storage_name.speed, params.speed );
            }
        });

        // устанавливаем ползунок прогресса
        controls.range.slider( 'values', 0, params.loop_start );
        self.Beat( params.loop_start );
        player.SetCurrentBeat( params.loop_start );

        // Состояние кнопок фрагмента
        if ( params.loop_start > 0 )
            controls.loop_start.addClass( 'enabled' );
        if ( params.loop_end < player.GetTotalBackbeats())
            controls.loop_end.addClass( 'enabled' );

        // keep focused on canvas
        $('#canvas').focus().blur( function (e){
            $(e.target).focus();
        });

        // $('.slider .ui-slider-handle').draggable(); // jquey Touch Punch lib
    }
    //*************************************************************************************
    function LoadParamsFromStorage( curr_song_is_set ) // берем текущие параметры из local storage
    {
        // Общие параметры
        params.volume = window.localStorage.getItem( local_storage_name.volume );
        params.meter  = window.localStorage.getItem( local_storage_name.meter );
        params.loop_repeat  = window.localStorage.getItem( local_storage_name.loop_repeat );

        // Song dependent params
        if ( curr_song_is_set )
        {
            params.speed        = window.localStorage.getItem( local_storage_name.speed );
            params.loop_start   = window.localStorage.getItem( local_storage_name.loop_start );
            params.loop_end     = window.localStorage.getItem( local_storage_name.loop_end );
        }
        else
        {
            params.speed        = 100;
            params.loop_start   = 0;
            params.loop_end     = player.GetTotalBackbeats();
        }

        // Дефолт
        params.volume       = params.volume != null ? parseInt( params.volume ) : 64;
        params.meter        = params.meter == '1' ? true : false;
        params.speed        = params.speed != null ? parseInt( params.speed ) : 100;
        params.loop_start   = params.loop_start ? parseInt( params.loop_start ) : 0;
        params.loop_end     = params.loop_end ? parseInt( params.loop_end ) : player.GetTotalBackbeats();
        params.loop_repeat  = params.loop_repeat == '1' ? true : false;

        // Устанавливаем значения
        player.SetVolume( params.volume );
        player.SetSpeed( params.speed );
        SetMeter( params.meter );
        SetLoopRepeat( params.loop_repeat );
        SetLoopStart( params.loop_start );
        SetLoopEnd( params.loop_end );
    }
    //*************************************************************************************
    self.IsInFullScreenMode = function()
    {
        return is_full_screen;
    };
    //*************************************************************************************
    $(document).on("click", ".player_controls .panel", function(event)
    {
        event.stopPropagation();
    });
    //*************************************************************************************
    $(document).on("click", ".player_controls", function(event)
    {
        event.stopPropagation();
        self.GUI_PlayPause();
    });
    //*************************************************************************************
    $(document).on("click", ".player_controls .button.playback", function(event)
    {
        player.PlayFromStart();
    });
    //*************************************************************************************
    $(document).on("click", ".player_controls .button.rewind_backward", function(event)
    {
        StepLeft();
    });
    //*************************************************************************************
    $(document).on("click", ".player_controls .button.rewind_forward", function(event)
    {
        event.stopPropagation();
        StepRight();
    });
    //*************************************************************************************
    $(document).on("click", ".player_controls .close", function(event)
    {
        self.Close();
    });
    //********************************  TEMPO  ********************************************
    $(document).on("click", ".tempo .slow", function(event) // НЕ ИСПОЛЬЗУЕТСЯ
    {
        //$('.tempo .bpm span').text(( 2 - player.tempo ).toFixed(1));
    });
    $(document).on("click", ".tempo .fast", function(event) // НЕ ИСПОЛЬЗУЕТСЯ
    {
        //$('.tempo .bpm span').text(( 1 - player.tempo + 1 ).toFixed(1));
    });
    //*************************************************************************************
    $(document).on("keydown", ".player_container", function( e )
    {
        var stop_event = false;

        switch ( e.keyCode )
        {
            case 32: // space bar
                e.preventDefault();
                self.GUI_PlayPause();
                stop_event = true;
                break;

            case 13: // Enter
                e.preventDefault();
                player.PlayFromStart();
                stop_event = true;
                break;

            case 37: // left arrow  (backbeat left)
                StepLeft();
                stop_event = true;
                break;

            case 39: // right arrow  (backbeat right)
                StepRight();
                stop_event = true;
                break;

            case 38: // up arrow  (tempo up)
                var slider = $( "#slider-tempo" );
                var position = slider.slider('value') + 20;
                position = position <= slider.slider( 'option', 'max' ) ? position : slider.slider( 'option', 'max' );
                slider.slider('value', position );

                player.SetSpeed( position );
                stop_event = true;
                break;

            case 40: // down arrow  (tempo down)
                var slider = $( "#slider-tempo" );
                var position = slider.slider('value') - 20;
                position = position >= slider.slider( 'option', 'min' ) ? position : slider.slider( 'option', 'min' );
                slider.slider('value', position );

                player.SetSpeed( position );
                stop_event = true;
                break;

            case 188: // "<" - начало фрагмента
                $('.player_controls .button.loop_bounds.start').click();
                break;
            case 190: // "<" - конец фрагмента
                $('.player_controls .button.loop_bounds.end').click();
                break;
        }

        if ( stop_event )
        {
            e.stopPropagation();
            e.preventDefault();
        }
    });
    //*************************************************************************************
    $(document).on("click", ".player_controls .button.loop_bounds.start", function(event)
    {
        var progress = $( "#slider-progress" ).slider( "option", "value" );

        if ( params.loop_start > 0 )
        {
            controls.range.slider( 'values', 0, 0 ); // устанавливаем ползунок
            SetLoopStart( 0, false );       // Передаем параметр в плеер

            controls.loop_start.removeClass( 'enabled' );
        }
        else
        {
            controls.range.slider( 'values', 0, progress );  // устанавливаем ползунок
            SetLoopStart( progress );               // передаем параметр в плеер

            controls.loop_start.addClass( 'enabled' );
        }
    });
    //*************************************************************************************
    $(document).on("click", ".player_controls .button.loop_bounds.end", function(event)
    {
        var progress = $( "#slider-progress" ).slider( "option", "value" );

        if ( params.loop_end < player.GetTotalBackbeats())
        {
            controls.range.slider( 'values', 1, player.GetTotalBackbeats() ); // устанавливаем ползунок
            SetLoopEnd( player.GetTotalBackbeats(), false, false );  // Передаем параметры в плеер

            controls.loop_end.removeClass( 'enabled' );
        }
        else
        {
            var backbeat = SetLoopEnd( progress, true, true );
            controls.range.slider( 'values', 1, backbeat ); // устанавливаем ползунок

            controls.loop_end.addClass( 'enabled' );
        }
    });
    //*************************************************************************************
    $(document).on("click", ".player_controls .button.repeat", function(event)
    {
        if ( params.loop_repeat )
        {
            SetLoopRepeat( false, $(this));
        }
        else
        {
            SetLoopRepeat( true, $(this));
        }
    });
    //*************************************************************************************
    $(document).on("click", ".player_controls .button.meter", function(event)
    {
        if ( params.meter ) // enabled
        {
            SetMeter( false, $(this));
        }
        else
        {
            SetMeter( true, $(this));
        }
    });
    //*************************************************************************************
    $(document).on("click", "#loop-solid img", function(event) // НЕ ИСПОЛЬЗУЕТСЯ
    {
        if ($(this).hasClass('loop-off'))
        {
            $('#loop-solid .loop-off').hide();
            $('#loop-solid .loop-on').show();

            player.SetLoopSolid( true );
        }
        else
        {
            $('#loop-solid .loop-on').hide();
            $('#loop-solid .loop-off').show();

            player.SetLoopSolid( false );
        }
    });
    //*************************************************************************************
    function ResetState()
    {
        // Кнопка Loop Bounds
        $('.button.loop_bounds').removeClass( 'enabled' );
        $('.button.loop_bounds').removeClass( 'enabled' );
    }
    //*************************************************************************************
    function SetMeter( enabled, btn )
    {
        btn = btn ? btn : $('.player_controls .button.meter');

        if ( enabled )
        {
            btn.addClass('enabled');
            params.meter = true;
            player.EnableMeter( true );
        }
        else
        {
            btn.removeClass('enabled');
            params.meter = false;
            player.EnableMeter( false );
        }

        window.localStorage.setItem( local_storage_name.meter, params.meter ? 1 : 0 );
    }
    //*************************************************************************************
    function SetLoopRepeat( enabled, btn )
    {
        btn = btn ? btn : $('.player_controls .button.repeat');

        if ( enabled )
        {
            btn.addClass('enabled');
            params.loop_repeat = true;
            player.EnableRepeat( true );
        }
        else
        {
            btn.removeClass('enabled');
            params.loop_repeat = false;
            player.EnableRepeat( false );
        }

        window.localStorage.setItem( local_storage_name.loop_repeat, params.loop_repeat ? 1 : 0 );
    }
    //*************************************************************************************
    function StepLeft()
    {
        var slider = $( "#slider-progress" );
        var position = slider.slider('value') - 8;
        position = position >= 0 ? position : 0;
        slider.slider('value', position );

        player.SetCurrentBeat( position );
    }
    //*************************************************************************************
    function StepRight()
    {
        var slider = $( "#slider-progress" );
        var position = slider.slider('value') + 8;
        position = position <= slider.slider( 'option', 'max' ) ? position : slider.slider( 'option', 'max' );
        slider.slider('value', position );

        player.SetCurrentBeat( position );
    }
    //*************************************************************************************
    function SetLoopStart( val, move_pointer )
    {
        if ( typeof move_pointer == 'undefined' )
            move_pointer = true;

        player.SetLoopStart( val, move_pointer );
        params.loop_start = val;

        window.localStorage.setItem( local_storage_name.loop_start, params.loop_start );
    }
    //*************************************************************************************
    function SetLoopEnd( progress, move_pointer, shift_pointer )
    {
        move_pointer = move_pointer || false;

        var backbeat = player.SetLoopEnd( progress, move_pointer, shift_pointer );
        params.loop_end = backbeat;

        window.localStorage.setItem( local_storage_name.loop_end, params.loop_end );

        return backbeat;
    }
    //*************************************************************************************
    // Callback
    //*************************************************************************************
    self.SetLoadProgress = function( value )
    {
        load_progress.progressbar( "value", value );
    }
    //*************************************************************************************
    self.RefreshLoadScreen = function()
    {
        self.SetLoadProgress( 0 );

        alrt.find('.btn-retry').hide();
        alrt.hide();
    }
    //*************************************************************************************
    self.GUI_PlayPause = function() // Play/Pause button click
    {

        var panels = $('.visible_in_pause');

        if ( panels.is(':visible') == false || player.playing ) // играет и мы останавливаем
        {
            panels.fadeIn( 200 );

            // Кнопка Play/Pause
            $('.button-play-pause').removeClass('pause');
            $('.button-play-pause').addClass('play');

            player.Pause();
        }
        else
        if ( is_full_screen && panels.is(':visible') && player.playing == false ) // остановлен и мы запускаем
        {
            panels.fadeOut( 200 );

            $('.button-play-pause').removeClass('play');
            $('.button-play-pause').addClass('pause');

            player.Play();
        }
    }
    //*************************************************************************************
    // Смещение прогрессбара
    self.Beat = function( backbeat )
    {
        // Set progress slider
        controls.progress.slider( "value", backbeat );
    }
    //*************************************************************************************
    self.GoFullScreen = function( cb_Result ) // возвращает в коллбэк true / false
    {
        if ( is_full_screen )
        {
            cb_Result( true );
            return;
        }

        $('.load_screen').show();

        Utils.goFullScreen( document.getElementById("player_container"));

        // FULLSCREEN
        $(document).on( 'mozfullscreenchange webkitfullscreenchange fullscreenchange', function (e)
        {
            var full_screen = document.fullScreen || document.mozFullScreen || document.webkitIsFullScreen; // This will return true or false depending on if it's full screen or not.

            if ( full_screen )
            {
                if ( is_full_screen == false )
                {
                    is_full_screen = true;
                    screen.orientation.lock( 'landscape' );

                    InitLoader();

                    // Заставка
                    cb_Result( true, true );
                }
            }
            else
            {
                if ( is_full_screen )
                {
                    screen.orientation.unlock();
                    is_full_screen = false;
                    self.Close();
                    cb_Result( true, false );
                }
            }
        });

        $(document).on( 'mozfullscreenerror webkitfullscreenerror fullscreenerror', function ()
        {
            is_full_screen = false;
            self.Close();
            cb_Result( false );
        });
    }
    //*************************************************************************************
    function InitLoader()
    {
        ResetState();

        SetCanvasSize();
        $('#player_container').fadeIn(300);

        // Set progress
        if ( load_progress == null )
        {
            load_progress = $('#load-progress');
            load_progress_label = $('#load-progress .progress-label');

            load_progress.progressbar({
                value: false,
                change: function() {

                    var val = load_progress.progressbar( "value" );

                    load_progress_label.text( load_progress.progressbar( "value" ) + "%" );
                },
                complete: function() {
                    load_progress_label.text( "Complete!" );
                }
            });
        }

        // Did You Know?
        var tip_text = $('.preload .load_screen_tip').text();
        $('.load_screen .didyouknow-text span').text( tip_text );
    }
    //*************************************************************************************
    self.ShowAlert = function( alert_class, text, onClose, onRetry )
    {
        var alrt_box = alrt.find( '.alert' );

        alrt.find('span').text( text );

        // Выставляем класс
        alrt_box.removeClass( 'success' );
        alrt_box.removeClass( 'info' );
        alrt_box.removeClass( 'warning' );
        alrt_box.removeClass( 'danger' );
        alrt_box.addClass( alert_class );

        // Добавляем кнопки
        var btn_close = alrt_box.find( '.return' );
        var btn_retry = alrt_box.find( '.retry' );

        btn_close.click( function (e)
        {
            e.preventDefault();
            onClose();
        });

        if ( onRetry )
        {
            btn_retry.click( function (e)
            {
                e.preventDefault();
                onRetry();
            });
            btn_retry.show();
        }
        else
            btn_retry.hide();

        alrt.fadeIn( 300 );
    }
    //*************************************************************************************
    self.SetSongInfo = function( song_data )
    {
        $('.player_controls .song_thumb').attr( 'src', song_data.thumb );
        $('.player_controls .description .song_name').text( song_data.name );
        $('.player_controls .description .song_artist').text( song_data.artist );
    }
    //*************************************************************************************
    self.Close = function()
    {
        if ( player )
            self.GUI_PlayPause();

        $('#player_container').hide();
        alrt.hide();
        Utils.exitFullScreen();
    }
    //*************************************************************************************
    function SetCanvasSize()
    {
        var canvas = document.getElementById("canvas");
        var width = screen.width;
        var height = screen.height;

        if ( canvas.width < window.innerWidth)
             canvas.width = window.innerWidth;

        if ( canvas.height < window.innerHeight)
             canvas.height = window.innerHeight;
    }
    //*************************************************************************************
}

/**
 * Created by Igor on 21.10.2017.
 *
 * Этот объект инкапсулирует все детали проигрывателя
 * - Midi-Player
 * - Player GUI
 * - Song Loader
 */

// Здесь перечислены все этапы загрузки в процентах. В сумме должно быть 100
var player_load_progress = {

    tabs        : 10, //   10
    soundfont   : 40, //   30
    neck_1      : 56, //   16
    neck_2      : 72, //   16
    font        : 89, //   17
    fly_strips  : 90, //   1
    bckg_img    : 100 //   10
};

var PlayerDispatcher = function ()
{
    var self = this;

    var player = null;
    var GUI = new PlayerGUI();

    self.current_song = null;
    self.loading_song_id = 0;   // ID песни, которая загружается в данный момент
    self.loading_progress = 0;  // здесь суммируется процент загрузки плеера

    var loaded_from_storage = false;

    // эти переменные выставляются снаружи
    self.voc = null; // словарь

    // Коллбэки
    self.cbLoadResult = null;   // передается в LoadSong
    self.cbLoadSongData = null; // задается в SongManager

    //*****************************************************************************************
    self.LoadSong = function( song_id, curr_song_data, cbResult )
    {
        self.loading_song_id = song_id;
        self.cbLoadResult = cbResult;
        self.loading_progress = 0;

        // Если данные песни были получены из local storage
        if ( curr_song_data )
        {
            self.current_song = curr_song_data;
            loaded_from_storage = true;
        }
        else
            loaded_from_storage = false;

        InitPlayer( function( result )
        {
            if ( result ) // плеер запущен
            {
                if ( player.InitTabs( self.current_song.tabs ))
                    onPlayerReady( true );
                else
                {
                    GUI.ShowAlert( 'danger', self.voc.player_init_failed, OnCloseLoadScreen, OnLoadRetry );
                }
            }
            else // не удалось получить полный экран
            {
                GUI.Close();
                self.cbLoadResult( false );
            }

            //----------------------------------------------------------------------
            // Плеер запущен, табы заряжены
            function onPlayerReady( result )
            {
                if ( result )
                {
                    GUI.InitPlayerInterface( player, loaded_from_storage );
                    GUI.SetSongInfo( self.current_song );

                    // callbacks
                    player.cb_PlayPause = GUI.GUI_PlayPause;
                    player.cb_Beat = GUI.Beat;

                    player.InitState();

                    // Снятие заставки
                    $('.load_screen').fadeOut( 500, function ()
                    {
                        GUI.GUI_PlayPause(); // запуск проигрывания сразу после загрузки
                        // FOR TEST
                    });

                    self.cbLoadResult( true );
                }
                else
                {
                    player = null;
                    GUI.ShowAlert( 'danger', self.voc.network_err, OnCloseLoadScreen, OnLoadRetry );
                }
            }
        });
    }
    //*****************************************************************************************
    self.IsInFullScreenMode = function()
    {
        return GUI.IsInFullScreenMode();
    };
    //*****************************************************************************************
    function InitPlayer( cbResult )
    {
        

        // Переход в полноэкранный режим
        GUI.GoFullScreen( OnFullScreen );

        function OnFullScreen( result, running )
        {
            if ( result ) // успешно
            {
                if ( running )
                {
                    GUI.SetLoadProgress( 0 );

                    // ЗАГРУЖАЕМ ТАБЫ
                    if ( self.current_song && self.loading_song_id == self.current_song.id ) // чтобы два раза не грузить одно и то же
                        onSuccess( self.current_song );
                    else
                    {
                        

                        // Коллбэк в SongManager
                        self.cbLoadSongData(
                            self.loading_song_id,
                            onSuccess,
                            function onError( error_code, error_msg )
                            {
                                if ( typeof error_code == 'undefined' || typeof error_msg == 'undefined' )
                                    error_msg = self.voc.error + ' ' + self.voc.try_again;

                                GUI.ShowAlert( 'danger', error_msg, OnCloseLoadScreen, OnLoadRetry );
                            },
                            function onNetworkError()
                            {
                                GUI.ShowAlert( 'danger', self.voc.network_err, OnCloseLoadScreen, OnLoadRetry );
                            });
                    }

                    // Табы загружены успешно
                    function onSuccess( data )
                    {
                        self.current_song = data;

                        DisplayLoadProgress( player_load_progress.tabs );

                        // Проверяем загрузку плеера
                        if ( player == null || player.is_ready == false ) // не загружен
                        {

                            

                            // Загружаем плеер
                            MIDI.loadPlugin({
                                soundfontUrl: jsPlayerLibUrl + "soundfont/",
                                instrument: "acoustic_guitar_nylon",
                                onprogress: function ( state, percent )
                                {
                                    var soundfont_percent = player_load_progress.soundfont - player_load_progress.tabs;
                                    var progress = player_load_progress.tabs + Math.floor( percent * soundfont_percent ); // от tabs до soundfont

                                    if ( percent == 1 )
                                    {
                                        self.loading_progress = progress; // 40%
                                        
                                    }
                                    else

                                        
                                    
                                    

                                    GUI.SetLoadProgress( progress ); // здесь данные приходят иначе, поэтому мы не можем использовать DisplayLoadProgress()

                                },
                                onsuccess: function ()
                                {
                                    

                                    onMidiLoadSuccess();
                                },
                                onerror: function ()
                                {
                                    
                                    GUI.ShowAlert( 'danger', self.voc.network_err, OnCloseLoadScreen, OnLoadRetry );
                                }
                            }); // load MIDI

                            //----------------------------------------------------------------------------------------------
                            function onMidiLoadSuccess()
                            {
                                if ( player == null )
                                {
                                    // Init the player
                                    player = new Player( DisplayLoadProgress );
                                }

                                // Запуск
                                player.Init( function ( result ) // загрузка моделей происходит именно здесь
                                {
                                    if ( result )
                                        cbResult( true );
                                    else
                                    {
                                        
                                        GUI.ShowAlert( 'danger', self.voc.network_err, OnCloseLoadScreen, OnLoadRetry );
                                    }
                                });
                            }
                            //----------------------------------------------------------------------------------------------
                        } // плеер не загружен
                        else
                        {
                            DisplayLoadProgress( player_load_progress.soundfont );

                            cbResult( true ); // плеер загружен
                        }
                    } // сфддифсл - табы загружены
                } // плеер запущен
            } // fullscreen
            else
            {
                cbResult( false ); // не удалось получить полный экран
            }
        }
    }
    //*****************************************************************************************
    function DisplayLoadProgress( percent, scope )
    {
        // LOADING PROGRESS
        self.loading_progress = percent;
        GUI.SetLoadProgress( self.loading_progress );

        
    }
    //*****************************************************************************************
    // Callbacks from alert
    //*****************************************************************************************
    function OnLoadRetry(e)
    {
        GUI.RefreshLoadScreen();
        self.LoadSong( self.loading_song_id, self.cbLoadResult );
    }
    //*****************************************************************************************
    function OnCloseLoadScreen(e)
    {
        GUI.Close();
        self.cbLoadResult( false );
    }
    //*****************************************************************************************
}

PlayerDispatch = new PlayerDispatcher();})();