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
