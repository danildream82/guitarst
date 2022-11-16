
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

        //console.log('current_tick_size = ' + current_tick_size);
        //console.log('backbeat_time = ' + backbeat_time );

        // считаем количество прошедших бэкбитов и сохраняем их в массиве
        while( backbeat_time >= backbeat_size ) // произошел ли переход в след. бэкбит относительно времени
        {
            //console.log('backbeat: ' + self.backbeat );

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
        // MIDI.programChange(0, MIDI.GM.byName["acoustic_guitar_nylon"].number);
        MIDI.programChange(0, MIDI.GM.byName["acoustic_guitar_steel"].number);
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

        console.log("MIDI-Player - Play");
    };
    //*****************************************************************************************
    self.Pause = function()
    {
        self.playing = false;
        self.TickManager();

        console.log("MIDI-Player - Pause");

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

        console.log('Set Loop Start: ' + backbeat );
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

        console.log('Set Loop End: ' + backbeat );

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
        console.log('SET CURRENT BEAT: ' + backbeat );

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

                // console.log( 'backbeat: ' + pointer.backbeat );

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
                PlayNotes(); // звук
                DisplayNotes( pointer, gplayer.AddNote ); // добавляем ноты на экран
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

                if ( note.local_data.visible || note.tiedNote )
                {
                    sound_system.PlayNote( note, beat, voice, speed );
                }
            } // for notes
        }
    }
    //*****************************************************************************************
};

