/**
 * Created by Igor on 10.04.2018.
 */

//******* Структра саундфонта
// (21) A0  - метроном
// (22) Bb0 - перкуссия 6-й струны
// (23) B0  - перкуссия 5-й струны
// (24) C1  - перкуссия 4-й струны
// (25) Db1 - перкуссия дискантов
// остальные сэмплы

var SoundSystem = function ()
{
    var self = this;

    var strings = [];
    var slide_volume = 0; // запоминает предыдущую громкостьлада в слайде

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

        note.duration_msec = beat.backbeat_size * duration;

        if ( note.tiedNote )
            return;

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
        // Глушение
        if ( typeof note.effect.palmMute != 'undefined' && note.effect.palmMute )
        {
            MIDI.noteOn( 0, pitch, note.velocity, 0 );
            MIDI.noteOff( 0, pitch, 0.01 );
        }
        else
        if ( note.value > 0 && typeof note.effect.deadNote != 'undefined' && note.effect.deadNote )
        {
            MIDI.noteOn( 0, pitch, note.velocity * 0.7, 0 );
            MIDI.noteOff( 0, pitch, 0.01 );
        }
        else
        // обычная нота
        {
            var velocity = note.velocity;

            // если это нота следующая за слайдом, тогда задаем ей громкость
            if ( slide_volume )
            {
                velocity = slide_volume;
                slide_volume = 0;
            }

            MIDI.noteOn( 0, pitch, velocity, 0 );
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
        velocity = velocity > 40 ? velocity : 40;
        slide_volume = velocity; // запоминаем уровень громкости

        duration = duration / ( Math.abs( note.effect.slide.next_fret - note.value ) + 1 ); // длительность звучания текущего лада в слайде
        var duration_msec = duration * beat.backbeat_size;

        // SOUND
        var pitch = strings[note.string - 1].value + note.effect.slide.current_fret; // отсчитываем лад от открытой струны

        MIDI.noteOn( 0, pitch, velocity, 0 );
        MIDI.noteOff( 0, pitch, duration_msec * speed / 1000 );

        // задаем следующий лад
        if ( note.effect.slide.next_fret > note.value == 1 ) // направление слайда
            note.effect.slide.current_fret++;
        else
            note.effect.slide.current_fret--;
    };
    //*****************************************************************************************
    function PlayPercussion ( note )
    {
        // 22 - басовая E
        // 23 - A
        // 24 - D
        // 25 - дисканты

        var pitch = 22; // басовая E
        var velocity = 25;

        switch (note.string)
        {
            case 6:
                pitch = 22; // E
                break;
            case 5:
                pitch = 23; // A
                break;
            default: // D + дисканты
                pitch = 25; // вряд ли кто-то лупит 4-ю струну об гриф
                velocity = 50;
                break;
        }

        MIDI.noteOn( 0, pitch, velocity, 0 );
        MIDI.noteOff( 0, pitch, 0 );
    }
    //*****************************************************************************************

    //*****************************************************************************************
};