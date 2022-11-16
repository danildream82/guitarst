<?php
/**
 * Created by Igor
 * Date: 14.11.2018
 * Time: 13:07
 *
 * ИНСТРУКЦИЯ !!!
 *
 * 1. Обрабатываем исходники файлы с пом. obfuscator/pack.php
 *    На выходе получаем один большой файл плеера
 *
 * 2. Обрабатываем файл плеера обфускатором
 *
 * 3. Результат обрабатываем с пом. obfuscator/rename.php
 *
 * 4. Еще раз обрабатываем обфускатором для минификации.
 *
 * 5. Обфусцируем все оставшиеся файлы
 *
 * Командная строка для обфускатора:
 *
 * javascript-obfuscator player.js
 * --rename-globals false
 * --compact false
 * --identifier-names-generator mangled
 * --string-array-threshold 1
 * --transform-object-keys true
 * --rotate-string-array false
 * --domain-lock guitarsteam.com
 * --disable-console-output true
 *
 * После переименования нужно снова пропустить код через обфускатор для минификации:
 *
 * javascript-obfuscator
 * player-renamed.js
 * --compact true
 * --debug-protection false              // отказываемся из-за тормозов
 * --debug-protection-interval false     // отказываемся из-за тормозов
 *
 * результат - готовый файл player.js
 *
 * Все остальные .JS фйлы в папке module кодируются с помощью такой команды:
 *
 * javascript-obfuscator <file.js>
 * --compact-true
 * --string-array true
 * --string-array-threshold 1
 * --string-array-encoding rc4
 * --rotate-string-array true
 */

define( 'PLAYER_JS', '../wp-content/themes/guitarsteam/js/player/player.js' );
define( 'PLAYER_OBF_JS', '../wp-content/themes/guitarsteam/js/player/player-obfuscated.js' );
define( 'THREE_JS', '../wp-content/themes/guitarsteam/js/lib/player/three.min.js' );
define( 'THREE_JS_BCKP', '../wp-content/themes/guitarsteam/js/lib/player/three_bckp.min.js' );
define( 'TWEEN_JS', '../wp-content/themes/guitarsteam/js/lib/player/tween.js' );
define( 'MIDI_JS', '../wp-content/themes/guitarsteam/js/lib/player/midi-js/build/MIDI.min.js' );
define( 'MIDI_JS_BCKP', '../wp-content/themes/guitarsteam/js/lib/player/midi-js/build/MIDI_bckp.min.js' );
define( 'TABS', './eye_of_the_tiger.gp5.json' );
define( 'OUTPUT_FILE', '../wp-content/themes/guitarsteam/js/player/player-renamed.js' );

class gsObfuscator
{
    protected $js_src_file;     // исходный, незашифрованный код
    protected $js_file;         // исходный, зашифрованный файл
    protected $tabs_file;
    protected $three_js_file;
    protected $tween_js_file;
    protected $midi_js_file;
    protected $new_names = [];  // сгенерированные имена

    protected $count = 0;
    protected $lib_js_count = 0;

    protected $js_exceptions = array(

        // Стандартные
        'forEach',
        'splice',
        'split',
        'charCodeAt',
        'push',
        'pop',
        'reverse',
        'indexOf',
        'length',
        'toFixed',
        'Math',
        'shift',
        'click',
        'screen',
        'orientation',
        'lock',
        'unlock',
        'offsetWidth',
        'offsetHeight',
        'parse',
        'log',

        'requestFullScreen',
        'webkitRequestFullScreen',
        'mozRequestFullScreen',

        'exitFullscreen',
        'webkitExitFullscreen',
        'mozCancelFullScreen',
        'msExitFullscreen',

        'mozfullscreenchange\x20webkitfullscreenchange\x20fullscreenchange',
        'mozfullscreenerror\x20webkitfullscreenerror\x20fullscreenerror',

        'slider',
        'localStorage', 'setItem', 'getItem',

        // JQuery
        'addClass', 'removeClass',
        'focus',
        'blur',
        'preventDefault',
        'target',
        'keyCode',
        'stopPropagation',
        'parent',
        'value',
        'attr',
        'volume',
        'cookie',
        'show',
        'hide',
        'fadeIn',
        'fadeOut',
        'find',
        'progressbar',

        // Dispatrcher -> public
        'current_song',
        'tabs',
        'loading_song_id',
        'loading_progress',
        'voc',
        'cbLoadResult',
        'cbLoadSongData',
        'LoadSong',
        'IsInFullScreenMode',
        'thumb',
        'name',
        'artist',

        'player_container'
    );
    protected $three_js_exceptions = array(
        'width', 'height',
        'clear',
        'Color',
        'update',
        'font',
        'vertices',
        'boundingBox',
        'values',
        'copy',
        'steps',
        'bevelEnabled',
        'extrudePath',
        'replace'
    );
    protected $three_js_str_encode = array( // строковые параметры, которые нужно переименовать
        'Geometry',
        'BufferGeometry',
        'BoxGeometry',
        'CubeGeometry',
        'TextGeometry',
        'TextBufferGeometry',
        'PlaneGeometry',
        'PlaneBufferGeometry',
        'ConeGeometry',
        'CylinderGeometry',
        'ExtrudeGeometry',
        'RingGeometry',
        'CircleGeometry'
    );

    protected $midi_js_exceptions = array(
        'urls'
    );

    public function __construct()
    {
        // Исходный код
        $this->js_src_file = file_get_contents( PLAYER_JS );

        // Исходный зашифрованный файл
        $this->js_file = file_get_contents( PLAYER_OBF_JS );

        $this->three_js_file = file_get_contents( THREE_JS_BCKP );
        $this->tween_js_file = file_get_contents( TWEEN_JS );
        $this->midi_js_file  = file_get_contents( MIDI_JS_BCKP );

        file_put_contents( THREE_JS, $this->three_js_file );
        file_put_contents( MIDI_JS,  $this->midi_js_file );

        // Файл с табами
        $this->tabs_file = file_get_contents( TABS );
    }
    //*******************************************************************************************
    public function RenameFunctions()
    {
        // Парсинг массива строк
        $pos1 = strpos( $this->js_file, '[' ) + 1;
        $pos2 = strpos( $this->js_file, '];' ) - 1;

        $str_array = substr( $this->js_file, $pos1, $pos2 - $pos1 );
//        $str_array = str_replace( "\n", '', $str_array ); // так тоже можно, но тогда привязывать к домену надо ПОСЛЕ переименований

        $strings = explode( ",\n", $str_array );

        $this->count = 0;
        $this->lib_js_count = 0;

        // Перебираем строки
        foreach ( $strings as $key => $str )
        {
            $this->count++;

            // Чистим строку
            $str = trim( $str );
            $str = str_replace( "'", '', $str );

            if (
                strpos( $str, '[' ) !== false ||
                strpos( $str, '{' ) !== false ||
                strpos( $str, 'function' ) !== false ||
                strpos( $str, 'apply' ) !== false ||
                strpos( $str, '[a-z0-9]' ) !== false )
            {
                array_push( $this->new_names, $str );
                continue;
            }

//            if ( $this->count == 1 ) // FOR TEST
//            {
//                $a = 123;
//            }
//
//            if ( $this->count > 1 ) // FOR TEST
//            {
//                array_push( $this->new_names, $str );
//                continue;
//            }

            // Ищем в исключениях
            if ( in_array( $str, $this->js_exceptions ))
            {
                array_push( $this->new_names, $str );
                continue;
            }

            // Ищем в незашифрованном коде скрипта
            if ( $this->SearchInSource( $str ))
            {
                continue;
            }

            // Ищем в табах
            if ( strpos( $this->tabs_file, $str ) !== false )
            {
                array_push( $this->new_names, $str );
                continue;
            }

            // селекторы jQuery
            if (
                strpos( $str, '.' ) !== false ||
                strpos( $str, '#' ) !== false ||
                strpos( $str, '-' ) !== false ||
                strpos( $str, ' ' ) !== false )
            {
                array_push( $this->new_names, $str );
                continue;
            }

            $new_name = $this->GenerateNewName();

            // Three.js
            if ( $this->SearchInLib(
                $str, $new_name,
                $this->three_js_file,
                $this->three_js_exceptions,
                $this->three_js_str_encode,
                'THREE' ))
            {
                continue;
            }

            if ( $this->SearchInTween( $str, $new_name ))
            {
                array_push( $this->new_names, $str );
                continue;
            }

            // MIDI.js
            if ( $this->SearchInLib(
                $str, $new_name,
                $this->midi_js_file,
                $this->midi_js_exceptions,
                [],
                'MIDI' ))
            {
                continue;
            }

            // Ищем в исходном зашифрованном файле
            $this->SearchInObfuscatedFile( $str, $new_name );

            array_push( $this->new_names, $new_name );
        }

        // Вставляем новые строки в исходный файл
        $this->js_file = substr_replace(
            $this->js_file,
            $this->StringifyNewNames(),
            $pos1,
            $pos2 - $pos1 );

        file_put_contents( OUTPUT_FILE, $this->js_file );
        file_put_contents( THREE_JS, $this->three_js_file );
        file_put_contents( MIDI_JS, $this->midi_js_file );
    }
    //*******************************************************************************************
    protected function SearchInSource( $str )
    {
        $continue = false;

        $found_quote = false;

        if (
            strpos( $this->js_src_file, "'" . $str ) ||
            strpos( $this->js_src_file, '"' . $str ))
        {
            $found_quote = true;
        }

        $found_dot = false;

        if ( strpos( $this->js_src_file, '.' . $str ))
            $found_dot = true;

        if (( $found_quote && $found_dot == false ) ||
              strpos( $this->js_src_file, 'document.' . $str ) ||
              strpos( $this->js_src_file, 'window.' . $str ) ||
              strpos( $this->js_src_file, 'Math.' . $str ))
        {
            array_push( $this->new_names, $str );
            $continue = true;
        }

        return $continue;
    }
    //*******************************************************************************************
    protected function SearchInObfuscatedFile( $str, $new_name )
    {
        // Определяем точку начала кода программы
        $offset = strpos( $this->js_file, '(function () {' );

        if ( strpos( $this->js_file, '.' . $str, $offset ))
        {
            $this->js_file = str_replace( '.' . $str, '.' . $new_name, $this->js_file );
        }
    }
    //*******************************************************************************************
    protected function SearchInLib( $str, $new_name, &$lib_file, $lib_exceptions, $lib_str_encode, $obj_name )
    {
        $continue = false;

        if ( in_array( $str, $lib_exceptions ))
        {
            array_push( $this->new_names, $str );
            return true;
        }

        if ( strpos( $lib_file, '"' . $str . '"' ) && in_array( $str, $lib_str_encode ) == false ) // строковые параметры не трогаем (если нет соответствующих исключений)
        {
            array_push( $this->new_names, $str );
            return true;
        }

        if ( strpos( $lib_file, '.' . $str ))
        {
            $this->lib_js_count++;

//            if ( $this->lib_js_count == 8 ) //  FOR TEST
//            {
//                $a = 123;
//            }
//
//            if ( $this->lib_js_count > 8 ) //  FOR TEST
//            {
//                array_push( $this->new_names, $str );
//                return true;
//            }

            echo $obj_name . ': ' . $str . ' - ' . $new_name . '<br>';

            if ( strpos( $lib_file, '.' . $str ))
            {
                $lib_file = str_replace( '.' . $str . '.', '.' . $new_name . '.', $lib_file );
                $lib_file = str_replace( '.' . $str . ',', '.' . $new_name . ',', $lib_file );
                $lib_file = str_replace( '.' . $str . '=', '.' . $new_name . '=', $lib_file );
                $lib_file = str_replace( '.' . $str . ';', '.' . $new_name . ';', $lib_file );
                $lib_file = str_replace( '.' . $str . ')', '.' . $new_name . ')', $lib_file );
                $lib_file = str_replace( '.' . $str . '(', '.' . $new_name . '(', $lib_file );
                $lib_file = str_replace( '.' . $str . '[', '.' . $new_name . '[', $lib_file );
                $lib_file = str_replace( '.' . $str . ']', '.' . $new_name . ']', $lib_file );
                $lib_file = str_replace( '.' . $str . '}', '.' . $new_name . '}', $lib_file );
                $lib_file = str_replace( '.' . $str . '!', '.' . $new_name . '!', $lib_file );
                $lib_file = str_replace( '.' . $str . '?', '.' . $new_name . '?', $lib_file );
                $lib_file = str_replace( '.' . $str . '>', '.' . $new_name . '>', $lib_file );
                $lib_file = str_replace( '.' . $str . '<', '.' . $new_name . '<', $lib_file );
                $lib_file = str_replace( '.' . $str . '+', '.' . $new_name . '+', $lib_file );
                $lib_file = str_replace( '.' . $str . '-', '.' . $new_name . '-', $lib_file );
                $lib_file = str_replace( '.' . $str . '*', '.' . $new_name . '*', $lib_file );
                $lib_file = str_replace( '.' . $str . '/', '.' . $new_name . '/', $lib_file );
                $lib_file = str_replace( '.' . $str . '&', '.' . $new_name . '&', $lib_file );
                $lib_file = str_replace( '.' . $str . '|', '.' . $new_name . '|', $lib_file );
                $lib_file = str_replace( '.' . $str . ' ', '.' . $new_name . ' ', $lib_file );
                $lib_file = str_replace( '"' . $str . '"', '"' . $new_name . '"', $lib_file );

                // элементы объектов - { name: ...
                $lib_file = str_replace( ',' . $str . ':', ',' . $new_name . ':', $lib_file );
                $lib_file = str_replace( '{' . $str . ':', '{' . $new_name . ':', $lib_file );
                $lib_file = str_replace( ' ' . $str . ':', ' ' . $new_name . ':', $lib_file );
                $lib_file = str_replace( "\t" . $str . ':', ' ' . $new_name . ':', $lib_file );
                $lib_file = str_replace( "\n" . $str . ':', ' ' . $new_name . ':', $lib_file );
                $lib_file = str_replace( "\r\n" . $str . ':', ' ' . $new_name . ':', $lib_file );

                // Замена в нашем коде
                $this->js_file = str_replace( $obj_name . '.' . $str, $obj_name . '.' . $new_name, $this->js_file );

                array_push( $this->new_names, $new_name );

                $continue = true;
            }
        }

        return $continue;
    }
    //*******************************************************************************************
    protected function SearchInTween( $str, $new_name )
    {
        $continue = false;

        // пока ничего с самим файлом не делаем, просто не шифруем
        if ( strpos( $this->tween_js_file, $str ))
            $continue = true;

        return $continue;
    }
    //*******************************************************************************************
    protected function StringifyNewNames()
    {
        foreach ( $this->new_names as $key => $name )
            $this->new_names[$key] = "'" . $name . "'";

        $str = implode( ",\n", $this->new_names );

        return $str;
    }
    //*******************************************************************************************
    protected function GenerateNewName()
    {
        $name = '';

        while(1)
        {
            $name = self::GenerateRandomCode( 4 );

            if ( in_array( $name, $this->new_names ) == false )
            {
                break;
            }
        }

        return $name;
    }
    //*******************************************************************************************
    protected static function GenerateRandomCode( $length )
    {
        $symbols = array(
            'a','b','c','d','e','f','g','h','i','j','k',
            'l','m','n','o','p','q','r','s','t','u','v',
            'w','x','y','z'
        );

        // Generate code
        $code = '';

        for ($i = 0; $i < $length; $i++)
        {
            $index = rand(0, count($symbols) - 1);
            $code .= $symbols[$index];
        }

        return $code;
    }
    //*******************************************************************************************
}

$obfuscator = new gsObfuscator();

$obfuscator->RenameFunctions();

echo '<br><br>Done.';