<?php
// ОПИСАНИЕ
//
//
//

define( 'TABS_VERSION', '1' );
define( 'BACKBEAT_SIZE', 64 );
define( 'DISPLAY_BEATS', false );

function BeatsCmpFunc( $beat1, $beat2 )
{
    return ( $beat1['start'] > $beat2['start'] ) ? true : false;
}

class FlyStripBuilder
{
    protected $gp_tabs = null;

    function __construct( &$gp_tabs )
    {
        $this->gp_tabs = $gp_tabs;
    }
    /*********************************************************************************/
    // Расчитываем летящие дорожки
    public function MarkFlyingStrips()
    {
        $this->track_idx = 0;

        $beats = $this->BeatsFlatArray();

        if ( $beats )
        {
            $strip_start_beat = 0;  // начало текущей дорожки (индекс бита)
            $strip_end_beat = 0;    // конец дорожки (индекс бита)
            $strip_fret_min = 100;
            $strip_fret_max = 0;

            // претендент на новую дорожку
            $next_strip_beat = 0;
            $next_strip_fret_min = 100;
            $next_strip_fret_max = 0;
            $next_strip_distance = $beats[0]['duration']['backbeats'];

            // beats
            for( $beat_idx = 0; $beat_idx < count($beats); $beat_idx++ )
            {
                $beat = $beats[$beat_idx];
                $notes = $beat['notes'];

                $beat_fret_min = 100;
                $beat_fret_max = 0;

                // перебираем ноты
                for ($this->note_idx = 0; $this->note_idx < count($notes); $this->note_idx++) // прямой перебор
                {
                    $note = $notes[$this->note_idx];

                    // Только видимые ноты на закрытых струнах
                    if ( isset($note['tiedNote']) == false && $note['value'] > 0 )
                    {
                        if ( $note['value'] < $beat_fret_min )
                        {
                            $beat_fret_min = $note['value'];
                        }
                        if ( $note['value'] > $beat_fret_max )
                        {
                            $beat_fret_max = $note['value'];
                        }
                    }
                } // for notes

                // смещение влево
                if ( $beat_fret_min < $strip_fret_min && $beat_idx != 0 )
                {
                    // если разлет нот слишком большой
                    if ( $this->MaxStripWidthExceeded( $beat_fret_min, $strip_fret_max ))
                    {
                        // Установка параметров текущей дорожки
                        $this->SetupStripData( $beats, $strip_start_beat, $strip_end_beat, $strip_fret_min, $strip_fret_max );

                        // новая дорожка
                        $strip_start_beat = $beat_idx;
                        $strip_fret_min = $beat_fret_min;
                        $strip_fret_max = $beat_fret_max;
                    }
                    else
                        $strip_fret_min = $beat_fret_min; // расширяем дорожку
                } // смещение влево
                else
                    // смещение вправо
                    if ( $beat_fret_max > $strip_fret_max && $beat_idx != 0 )
                    {
                        // если разлет нот слишком большой
                        if ( $this->MaxStripWidthExceeded( $strip_fret_min, $beat_fret_max ))
                        {
                            // Установка параметров текущей дорожки
                            $this->SetupStripData( $beats, $strip_start_beat, $strip_end_beat, $strip_fret_min, $strip_fret_max );

                            // новая дорожка
                            $strip_start_beat = $beat_idx;
                            $strip_fret_min = $beat_fret_min;
                            $strip_fret_max = $beat_fret_max;
                        }
                        else
                            $strip_fret_max = $beat_fret_max; // расширяем дорожку
                    } // смещение вправо

                $strip_end_beat = $beat_idx;
                $strip_fret_min = $beat_fret_min < $strip_fret_min ? $beat_fret_min : $strip_fret_min;
                $strip_fret_max = $beat_fret_max > $strip_fret_max ? $beat_fret_max : $strip_fret_max;

            } // for beats

            // Установка параметров текущей дорожки
            $this->SetupStripData( $beats, $strip_start_beat, $strip_end_beat, $strip_fret_min, $strip_fret_max );

            if ( DISPLAY_BEATS )
                $this->DisplayBeats( $beats );
        }

        return $this->gp_tabs;
    }
    /*********************************************************************************/
    protected function BeatsFlatArray( $track_idx = 0 )
    {
        $beats_array = array();

        $track = $this->gp_tabs['tracks'][$track_idx];
        $measures = $track['measures'];

        // measures
        for ( $measure_idx = 0; $measure_idx <= count($measures) - 1; $measure_idx++ )
        {
            $measure = $measures[$measure_idx];
            $beats = $measure['beats'];

            // beats
            for( $beat_idx = 0; $beat_idx < count($beats); $beat_idx++ )
            {
                $beat = $beats[$beat_idx];
                $voices = $beat['voices'];

                $beat['notes'] = array();
                $max_duration = null;

                for ( $voice_idx = 0; $voice_idx < count($voices); $voice_idx++ )
                {
                    $voice = $voices[$voice_idx];

                    $beat['notes'] = array_merge( $beat['notes'], $voice['notes'] );
                    $beat['measure_idx'] = $measure_idx;
                    $beat['beat_idx'] = $beat_idx;
                }

                unset( $beat['voices'] );
                unset( $beat['stroke'] );

                array_push( $beats_array, $beat ); // сохраняем
            } // for beats
        } // for measures

        return $beats_array;
    }
    /*********************************************************************************/
    protected function MaxStripWidthExceeded( $fret_min, $fret_max )
    {
        $width = $fret_max - $fret_min + 1;

        // Проверка максимальная ширины дорожки, В зависимости от номера лада грифа
        if ( $width > 3 )
            return true;

        return false;
    }
    /*********************************************************************************/
    protected function SetupStripData( &$beats, $strip_start_beat, $strip_end_beat, $strip_fret_min, $strip_fret_max )
    {
        $this->SetStripEdge( true, $beats, $strip_start_beat, $strip_fret_min, $strip_fret_max );
        $this->SetStripEdge( false, $beats, $strip_end_beat, $strip_fret_min, $strip_fret_max );
    }
    /*********************************************************************************/
    protected function SetStripEdge( $start, &$beats, $strip_edge_beat, $strip_fret_min, $strip_fret_max )
    {
        // ВНИМАНИЕ!!! Сюда передается индекс бита, который указывает или на начало фрагмента, или на его конец
        $beat = &$beats[$strip_edge_beat];

        // set data
        $strip_data = array( 'fret_min' => $strip_fret_min - 1, 'fret_max' => $strip_fret_max - 1 );

        $strip_field_name = $start ? 'strip_start' : 'strip_end';
        $beat[$strip_field_name] = $strip_data;

        // сохраняем в основной структуре табов
        $this->gp_tabs['tracks'][$this->track_idx]['measures'][$beat['measure_idx']]['beats'][$beat['beat_idx']][$strip_field_name] = $strip_data;
    }
    /*********************************************************************************/
    protected function DisplayBeats( $beats )
    {
        $current_strip = null;

        $this->DisplayFretNumbers();

        // перебираем ЗАДОМ НАПЕРЕД
        for ( $beat_idx = count( $beats ) - 1; $beat_idx >= 0 ; $beat_idx-- )
        {
            $beat = $beats[$beat_idx];

            // если стоит маркер дорожки
            if ( isset( $beat['strip_start'] ))
            {
                $strip = $beat['strip_start'];
            }
            if ( isset( $beat['strip_end'] )) // конец дорожки
            {
                $strip = $beat['strip_end'];
                $current_strip = $strip;
            }

            echo '<span style="display: inline-block; width: 50px; text-align: center">' . $beat_idx . '</span> |';

            // вывод ладовых промежутков
            for ( $fret = 1 ; $fret < 19; $fret++ )
            {
                // Если лад входит в состав дорожки
                if ( $fret >= $current_strip['fret_min'] && $fret <= $current_strip['fret_max'] )
                {
                    // Если здесь стоит нота
                    if ( $this->IsBeatNote( $beat, $fret ))
                    {
                        echo '&#9899;&#9899;&#9899;|';
                    }
                    else
                    {
                        echo '&#9898;&#9898;&#9898;|';
                    }
                }
                else
                    echo '&emsp;&ensp;&emsp;|';
            } // for frets

            echo '</br>';
        } // for beats

        $this->DisplayFretNumbers();
    }
    /*********************************************************************************/
    protected function IsBeatNote( $beat, $fret )
    {
        $found = false;
        $notes = $beat['notes'];

        for ( $i = 0; $i < count($notes) && $found == false ; $i++ )
        {
            $note = $notes[$i];

            if ( $note['value'] == $fret )
                $found = true;
        }

        return $found;
    }
    /*********************************************************************************/
    protected function DisplayFretNumbers()
    {
        echo '<span style="display: inline-block; width: 50px; text-align: center"></span> |';

        for ( $i = 1; $i <= 19; $i++ )
        {
            echo '&emsp;' . $i . '&emsp;|';
        }
        echo '</br>';
        echo '</br>';
        echo '</br>';
    }
    /*********************************************************************************/
};

//#####################################################################################

class TabsConverter
{
    protected $track_idx = 0;
    protected $measure_idx = 0;
    protected $beat_idx = 0;
    protected $voice_idx = 0;
    protected $note_idx = 0;

    protected $gp_tabs = null;

    protected $repeat_open = 0;

    function ConvertTabs( $json_tabs )
    {
        $this->gp_tabs = json_decode( $json_tabs, true );

        $this->SortBeats();

        $this->CalcBackBeats();     // Пересчет всех нот в 64-х долях такта
        $this->MultiplyMeasures();  // дублирование тактов (реприза)
        $this->TiedNotes();         // маркировка связанных нот (перебор задом наперед)
        $this->SetupNotes();        // хаммер/пул

        $strips_builder = new FlyStripBuilder( $this->gp_tabs );
        $this->gp_tabs = $strips_builder->MarkFlyingStrips();

        $this->gp_tabs['ver'] = TABS_VERSION;

        for( $i = 0; $i < count( $this->gp_tabs['tracks']); $i++ )
        {
            $this->gp_tabs['tracks'][$i]['measures'] = array_values( $this->gp_tabs['tracks'][$i]['measures'] );
        }

        $tabs = json_encode( $this->gp_tabs );

        return $tabs;
    }
    /*********************************************************************************/
    // сортируем биты по времени их старта
    protected function SortBeats()
    {
        for( $this->track_idx = 0;  $this->track_idx < count( $this->gp_tabs['tracks']); $this->track_idx++ )
        {
            $track = $this->gp_tabs['tracks'][$this->track_idx];
            $measures = $track['measures'];

            // measures
            for ($this->measure_idx = 0; $this->measure_idx < count($measures); $this->measure_idx++)
            {
                usort( $this->gp_tabs['tracks'][$this->track_idx]
                ['measures'][$this->measure_idx]
                ['beats'], 'BeatsCmpFunc' );
            } // for measures
        } // for tracks
    }
    /*********************************************************************************/
    // Поиск повторяющихся тактов
    protected function MultiplyMeasures()
    {
        for( $this->track_idx = 0;  $this->track_idx < count( $this->gp_tabs['tracks']); $this->track_idx++ )
        {
            $track = $this->gp_tabs['tracks'][$this->track_idx];
            $measures = $track['measures'];

            $array_len = count($measures);

            for( $this->measure_idx = 0; $this->measure_idx < $array_len; $this->measure_idx++ )
            {
                $array_len = $this->ParseMeasure( $array_len ); // проверяем репризу
            } // for measures
        } // for tracks
    }
    /*********************************************************************************/
    protected function ParseMeasure( $array_len )
    {
        $measure = $this->gp_tabs['tracks'][$this->track_idx]['measures'][$this->measure_idx];
        $header = $measure['header'];

        // Начало повтора
        if ( $header['repeatOpen'] )
        {
            $this->repeat_open = $this->measure_idx; // сохраняем для след. итерации
            $this->gp_tabs['tracks'][$this->track_idx]['measures'][$this->measure_idx]['header']['repeatOpen'] = false; // убираем repeatOpen
        }

        // Если такт с репризой
        if ( $header['repeatClose'] > 0 ) // количество прибавленных проигрываний
        {
            $times = $header['repeatClose']; // количество повторений
            $fragment_measures_count = $this->measure_idx - $this->repeat_open + 1;
            $this->gp_tabs['tracks'][$this->track_idx]['measures'][$this->measure_idx]['header']['repeatClose'] = 0; // убираем repeatClose

            $new_measures = array();

            // Размножаем такты
            for ( $i = 0; $i < $times; $i++ )
            {
                for ( $j = $this->repeat_open; $j <= $this->measure_idx; $j++ )
                {
                    $measure = $this->gp_tabs['tracks'][$this->track_idx]['measures'][$j];

//                    $measure['new'] = true; // FOR TEST

                    array_push( $new_measures, $measure );
                }
            }

            $fragment_size = 0;

            // Считаем длину повторяемого фрагмента в бэкбитах
            {
                // определяем номер бэкбита следующего за фрагментом такта, которого моежт и не быть
                $beats = $new_measures[ count( $new_measures ) - 1 ]['beats'];
                $last_beat = $beats[ count( $beats ) - 1 ];
                $voices = $last_beat['voices'];

                $max_time = 0;

                // ищем самый длииный голос
                foreach ( $voices as $voice )
                {
                    if ( $voice['duration']['backbeats'] > $max_time )
                        $max_time = $voice['duration']['backbeats'];
                }

                $fragment_size = $last_beat['start'] + $max_time - $new_measures[0]['beats'][0]['start'];
            }

            // Вставляем в исходный массив
            $measures = $this->gp_tabs['tracks'][$this->track_idx]['measures'];
            array_splice( $measures, $this->measure_idx + 1, 0, $new_measures );

            $array_len = count( $measures );

            // Пересчитываем номера бэкбитов среди новых скопированных
            $count = 0;
            $increment = 0;
            $fragment_shift = 0; // увеличение указателя на количество повторений фрагмента (множитель)

            for ( $i = $this->measure_idx + 1; $i <= $this->measure_idx + $fragment_measures_count * $times; $i++ ) // начинаем с первого повторения фрагмента
            {
                $count++;

                if ( $count <= $times )
                    $increment += 64;

                if (($count - 1) % $fragment_measures_count == 0 )
                {
                    $fragment_shift++;
                }

                $measures[$i]['start'] += $fragment_size * $fragment_shift;
                $measure = $measures[$i];

                for ( $j = 0; $j < count( $measure['beats'] ); $j++ ) // for all beats
                {
                    $measures[$i]['beats'][$j]['start'] += $fragment_size * $fragment_shift;
                }
            }

            // Пересчитываем номера бэкбитов у всех остальных тактов
            for ( ; $i < count( $measures ); $i++ )
            {
                $measures[$i]['start'] += $fragment_size * $fragment_shift;
                $measure = $measures[$i];

                for ( $j = 0; $j < count( $measure['beats'] ); $j++ ) // for all beats
                {
                    $measures[$i]['beats'][$j]['start'] += $fragment_size * $fragment_shift;
                }
            }

            $this->gp_tabs['tracks'][$this->track_idx]['measures'] = $measures; // сохраняем измененные такты
            $this->gp_tabs['tracks'][$this->track_idx]['total_backbeats'] += $fragment_size * $fragment_shift; // обновляем общий размер
        }

        return $array_len;
    }
    /*********************************************************************************/
    protected function CalcBackBeats()
    {
        for( $this->track_idx = 0;  $this->track_idx < count( $this->gp_tabs['tracks']); $this->track_idx++ )
        {
            $track = $this->gp_tabs['tracks'][$this->track_idx];
            $measures = $track['measures'];

            $total_backbeats = 0;

            // measures
            for ( $this->measure_idx = 0; $this->measure_idx < count($measures); $this->measure_idx++ )
            {
                $measure = $measures[$this->measure_idx];
                $beats = $measure['beats'];

                $voice_backbeats = array(); // длина голосов в бэкбитах

                // beats
                for( $this->beat_idx = 0; $this->beat_idx < count($beats); $this->beat_idx++ )
                {
                    $beat = $beats[$this->beat_idx];
                    $voices = $beat['voices'];

                    // начало бита в единах самого Гитар-Про
                    $gp_metric = $this->gp_tabs['tracks'][$this->track_idx]
                    ['measures'][$this->measure_idx]
                    ['beats'][$this->beat_idx]
                    ['start'];

                    // начало бита
                    $this->gp_tabs['tracks'][$this->track_idx]
                    ['measures'][$this->measure_idx]
                    ['beats'][$this->beat_idx]
                    ['start'] = ( $gp_metric - 960 ) / 60;

                    // сохраняем начало такта
                    if ( $this->beat_idx == 0 )
                    {
                        $this->gp_tabs['tracks'][$this->track_idx]
                        ['measures'][$this->measure_idx]['start'] = ( $gp_metric - 960 ) / 60;
                    }

                    // voices
                    for ( $this->voice_idx = 0; $this->voice_idx < count( $voices ); $this->voice_idx++ )
                    {
                        $voice = $voices[$this->voice_idx];
                        $backbeats = $this->GetNoteDuration( $voice );

                        // Суммируем длительность
                        if ( isset( $voice_backbeats[$voice['index']]) == false )
                            $voice_backbeats[$voice['index']] = $backbeats;
                        else
                            $voice_backbeats[$voice['index']] += $backbeats;

                        // сохраняем длительность
                        $this->gp_tabs['tracks'][$this->track_idx]
                        ['measures'][$this->measure_idx]
                        ['beats'][$this->beat_idx]
                        ['voices'][$this->voice_idx]['duration']['backbeats'] = $backbeats;

                    } // for voices
                } // for beats

                // определяем самый длинный голос
                $voice_max = 0;
                foreach ( $voice_backbeats as $voice_duration )
                {
                    if ( $voice_duration > $voice_max )
                        $voice_max = $voice_duration;
                }

                $total_backbeats += $voice_max;

                // размер бэкбита в зависимости от темпа
                $backbeat_size = $measure['header']['tempo']['msec'] / 16;

                $this->gp_tabs['tracks'][$this->track_idx]
                ['measures'][$this->measure_idx]['header']['tempo']['backbeat_size'] = $backbeat_size;

            } // for measures

            // Общая длина трека в бэкбитах
            $this->gp_tabs['tracks'][$this->track_idx]['total_backbeats'] = $total_backbeats;
        } // for tracks
    }
    /*********************************************************************************/
    // Перебор нот задом наперед
    protected function TiedNotes()
    {
        // track
        for( $this->track_idx = count( $this->gp_tabs['tracks']) - 1;  $this->track_idx >= 0 ; $this->track_idx-- )
        {
            $track = $this->gp_tabs['tracks'][$this->track_idx];
            $measures = $track['measures'];

            $prev_beat_start = 0;

            // measures
            for( $this->measure_idx = count($measures) - 1; $this->measure_idx >= 0; $this->measure_idx-- )
            {
                $measure = $measures[$this->measure_idx];
                $beats = $measure['beats'];

                if ( $this->measure_idx == 0 )
                {
                    $lksxlxjg = 123;
                }

                // beats
                for( $this->beat_idx = count($beats) - 1; $this->beat_idx >= 0; $this->beat_idx-- )
                {
                    $this->CalcPrevBeatStart( $prev_beat_start ); // роассчитываем расстояние между битами в бэкбитах

                    $beat = $beats[$this->beat_idx];
                    $voices = $beat['voices'];

                    // voices
                    for ( $this->voice_idx = 0; $this->voice_idx < count( $voices ); $this->voice_idx++ ) // прямой перебор
                    {
                        $voice = $voices[$this->voice_idx];
                        $notes = $voice['notes'];

                        // notes
                        for ( $this->note_idx = 0; $this->note_idx < count( $notes ); $this->note_idx++ ) // прямой перебор
                        {
                            $note = &$notes[$this->note_idx];

                            // Связанная нота
                            if ( !empty($note['tiedNote']))
                            {
                                // поиск связанных нот
                                $base_note = null;
                                $note['gs_duration'] = $this->GetNoteDuration( $voice ); // в 64-х долях

                                $tied_notes = array( $note );

                                if ( $this->SearchTiedNotes(
                                    $this->beat_idx, $this->measure_idx,
                                    $voice['index'],
                                    $note,
                                    $tied_notes, $base_note ))
                                {
                                    // Суммируем длительность и выставляем свойства
                                    $total_duration = 0;
                                    foreach( $tied_notes as $t_note )
                                        $total_duration += $t_note['gs_duration'];  // в 64-х долях

                                    // Set base note total duration
                                    $base_note_measure_idx = $base_note['note_measure_idx'];
                                    $base_note_beat_idx = $base_note['note_beat_idx'];
                                    $base_note_voice_idx = $base_note['voice_idx'];
                                    $base_note_idx = $base_note['note_idx'];

                                    // берем ноту из табов глобально
                                    $note_in_tabs = $this->gp_tabs['tracks'][$this->track_idx]
                                    ['measures'][$base_note_measure_idx]
                                    ['beats'][$base_note_beat_idx]
                                    ['voices'][$base_note_voice_idx]
                                    ['notes'][$base_note_idx];

                                    unset($note_in_tabs['tiedNote']);
                                    $note_in_tabs['gs_total_duration'] = $total_duration; // в 64-х долях
//                                    $note_in_tabs['gs_has_tied'] = 1; // пока не пригодилось

                                    // сохраняем в глобальный массив табов
                                    $this->gp_tabs['tracks'][$this->track_idx]
                                    ['measures'][$base_note_measure_idx]
                                    ['beats'][$base_note_beat_idx]
                                    ['voices'][$base_note_voice_idx]
                                    ['notes'][$base_note_idx] = $note_in_tabs;

                                    // сохраняем в локальную копию табов
                                    $track['measures'][$base_note_measure_idx]['beats'][$base_note_beat_idx]['voices'][$base_note_voice_idx]['notes'][$base_note_idx] = $note_in_tabs;
                                    $measures[$base_note_measure_idx]['beats'][$base_note_beat_idx]['voices'][$base_note_voice_idx]['notes'][$base_note_idx] = $note_in_tabs;
                                    $beats[$base_note_beat_idx]['voices'][$base_note_voice_idx]['notes'][$base_note_idx] = $note_in_tabs;
                                }
                            } // if tied note
                            else
                            {
                                unset( $note['tiedNote']);

                                $this->gp_tabs['tracks'][$this->track_idx]
                                ['measures'][$this->measure_idx]
                                ['beats'][$this->beat_idx]
                                ['voices'][$this->voice_idx]
                                ['notes'][$this->note_idx] = $note;
                            }
                        } // for notes
                    } // for voices
                } // for voices
            } // for measures
        } // for tracks
    }
    /*********************************************************************************/
    protected function CalcPrevBeatStart( &$prev_beat_start )
    {
        $pBeat = &$this->gp_tabs['tracks'][$this->track_idx]
        ['measures'][$this->measure_idx]
        ['beats'][$this->beat_idx];

        if ( $prev_beat_start > 0 )
        {
            $pBeat['duration_to_next'] = $prev_beat_start - $pBeat['start'];
        }
        else // первый бит с конца
        {
            // определяем самый длинный голос
            $max_voice_duration = 0;
            foreach ( $pBeat['voices'] as $voice )
            {
                if ( $voice['duration']['backbeats'] > $max_voice_duration )
                    $max_voice_duration = $voice['duration']['backbeats'];
            }

            $pBeat['duration_to_next'] = $max_voice_duration;
        }

        $prev_beat_start = $pBeat['start'];
    }
    /*********************************************************************************/
    // Поиск связанных нот перебором задом наперед
    protected function SearchTiedNotes( $beat_idx, $measure_idx, $voice_index, $start_note,
                                        &$tied_notes, &$base_note )
    {
        // Вычисляем номер предыдущего бита
        if ( $this->GetPrevBeat( $measure_idx, $beat_idx ) == false ) // если все ноты в произведении закончились
        {
            return false;
        }

        // FOR TEST
//        echo 'track = '. $this->track_idx . '</br>';
//        echo 'measure = ' . $measure_idx . '</br>';
//        echo 'beat = ' . $beat_idx . '</br>';

        if ( $measure_idx == 0 && $beat_idx == 6 )
        {
            $jkjlkjlkj = 123;
        }

        // Определяем есть ли среди голосов голос с нужным номером
        $voice_found = false;
        $voice_idx = 0; // ключ в массиве глосов

        foreach( $this->gp_tabs['tracks'][$this->track_idx]
        ['measures'][$measure_idx]
        ['beats'][$beat_idx]
        ['voices'] as $key => $voice )
        {
            if ( $voice['index'] == $voice_index ) // значение внутри объекта голоса
            {
                $voice_found = true;
                $voice_idx = $key;
                break;
            }
        }

        if ( $voice_found )
        {
            // берем ноты этого бита
            $voice = $this->gp_tabs['tracks'][$this->track_idx]['measures'][$measure_idx]['beats'][$beat_idx]['voices'][$voice_idx];
            $notes = $this->gp_tabs['tracks'][$this->track_idx]['measures'][$measure_idx]['beats'][$beat_idx]['voices'][$voice_idx]['notes'];

            // перебираем ноты
            for ( $idx = 0; $idx < count( $notes ); $idx++ )
            {
                $note = $notes[$idx];

                // если нота найдена
                if ( $note['string'] == $start_note['string'] ) // && $note['value'] == $start_note['value'] ) // вроде бы должно быть достаточно только струны
                {
                    if ( !empty($note['tiedNote'])) // если это тоже связанная нота
                    {
                        // получение длительности ноты
                        $note['gs_duration'] = $voice['duration']['backbeats']; // в 64-х долях
                        array_push( $tied_notes, $note );

                        // ищем дальше
                        $this->SearchTiedNotes( $beat_idx, $measure_idx, $voice_index, $start_note, $tied_notes, $base_note );
                        return true;
                    }
                    else // основная нота
                    {
                        $note['note_idx'] = $idx;
                        $note['note_beat_idx'] = $beat_idx;
                        $note['note_measure_idx'] = $measure_idx;
                        $note['voice_idx'] = $voice_idx;
                        $note['gs_duration'] = $voice['duration']['backbeats']; // в 64-х долях

                        $base_note = $note;
                        array_push( $tied_notes, $note );

                        return true;
                    }
                }
            } // for notes
        } // if voice exists

        // ищем дальше
        return $this->SearchTiedNotes( $beat_idx, $measure_idx, $voice_index, $start_note, $tied_notes, $base_note );
    }
    /*********************************************************************************/
    protected function GetPrevBeat( &$measure_idx, &$beat_idx )
    {
        $beats = $this->gp_tabs['tracks'][$this->track_idx]['measures'][$measure_idx]['beats'];

        if ( $beat_idx > 0 )
            $beat_idx--;
        else // берем предыдущий такт
        {
            if ( $measure_idx > 0 )
            {
                $measure_idx--;
                $measure = $this->gp_tabs['tracks'][$this->track_idx]['measures'][$measure_idx];
                $beat_idx = count( $measure['beats'] ) - 1;
            }
            else
                return false; // конец произведения
        }

        return true;
    }
    /*********************************************************************************/
    protected function GetNextBeat( &$measure_idx, &$beat_idx )
    {
        $measures = $this->gp_tabs['tracks'][$this->track_idx]['measures'];
        $beats = $measures[ $measure_idx ]['beats'];
        $found = true;

        if ( $beat_idx < count( $beats ) - 1 ) // если есть еще биты в текущем такте
        {
            $beat_idx++;
        }
        else // биты закончились, берем следующий такт
        {
            // если есть еще такты
            if ( $measure_idx < count( $measures ) - 1 )
            {
                $measure_idx++;

                // если в такте есть биты
                if ( count( $measures[ $measure_idx ]['beats'] ) > 0 )
                {
                    $beat_idx = 0;
                }
                else
                    $found = false;
            }
            else
                $found = false;
        }

        return $found;
    }
    /*********************************************************************************/
    // размер ноты в 64-х долях
    protected function GetNoteDuration( $voice )
    {
        $duration = $voice['duration'];
        $backbeats = BACKBEAT_SIZE / $duration['value'];

        if ( $duration['dotted'] )
        {
            $backbeats += $backbeats / 2;
        }

        return $backbeats;
    }
    /*********************************************************************************/
    protected function SetupNotes()
    {
        $prev_hammer = null;

        for( $this->track_idx = 0;  $this->track_idx < count( $this->gp_tabs['tracks']); $this->track_idx++ )
        {
            $track = $this->gp_tabs['tracks'][$this->track_idx];
            $measures = $track['measures'];

            // measures
            for ( $this->measure_idx = 0; $this->measure_idx < count($measures); $this->measure_idx++ )
            {
                $measure = $measures[$this->measure_idx];
                $beats = $measure['beats'];

                // beats
                for( $this->beat_idx = 0; $this->beat_idx < count($beats); $this->beat_idx++ )
                {
                    $beat = $beats[$this->beat_idx];
                    $voices = $beat['voices'];

                    $max_duration = null;

                    // voices
                    for ( $this->voice_idx = 0; $this->voice_idx < count( $voices ); $this->voice_idx++ )
                    {
                        $voice = $voices[$this->voice_idx];
                        $notes = $voice['notes'];

                        if ( $max_duration == null || $voice['duration']['backbeats'] > $max_duration['backbeats'] )
                            $max_duration = $voice['duration'];

                        // notes
                        for ( $this->note_idx = 0; $this->note_idx < count( $notes ); $this->note_idx++ )
                        {
                            $note = &$this->gp_tabs['tracks'][$this->track_idx]
                                                    ['measures'][$this->measure_idx]
                                                    ['beats'][$this->beat_idx]
                                                    ['voices'][$this->voice_idx]
                                                    ['notes'][$this->note_idx];

                            // Хаммер (переносится на след. ноту)
                            if ( $note['effect']['hammer'] )
                            {
                                $this->SetupNoteHammer( $note, $prev_hammer );

                                $prev_hammer = array(
                                    'string' => $note['string'], // сохраняем для след. ноты
                                    'fret' => $note['value'] );
                            }
                            else
                            {
                                $this->SetupNoteHammer( $note, $prev_hammer );
                                $prev_hammer = null;
                            }

                            // Слайд
                            if ( $note['effect']['slide'] )
                            {
                                $this->SetupNoteSlide( $note, $this->measure_idx, $this->beat_idx, $this->voice_idx );
                            }

                            // Сбрасываем неактивные флаги
                            if ( $note['effect']['deadNote'] == false )
                                unset( $note['effect']['deadNote'] );
                            if ( $note['effect']['popping'] == false )
                                unset( $note['effect']['popping'] );
                            if ( $note['effect']['tapping'] == false )
                                unset( $note['effect']['tapping'] );
                            if ( $note['effect']['letRing'] == false )
                                unset( $note['effect']['letRing'] );
                            if ( $note['effect']['accentuatedNote'] == false )
                                unset( $note['effect']['accentuatedNote'] );
                            if ( $note['effect']['trill'] == false )
                                unset( $note['effect']['trill'] );
                            if ( $note['effect']['fadeIn'] == false )
                                unset( $note['effect']['fadeIn'] );
                            if ( $note['effect']['slide'] == false )
                                unset( $note['effect']['slide'] );
                            if ( $note['effect']['slapping'] == false )
                                unset( $note['effect']['slapping'] );
                            if ( $note['effect']['heavyAccentuatedNote'] == false )
                                unset( $note['effect']['heavyAccentuatedNote'] );
                            if ( $note['effect']['grace'] == false )
                                unset( $note['effect']['grace'] );
                            if ( $note['effect']['tremoloPicking'] == false )
                                unset( $note['effect']['tremoloPicking'] );
                            if ( $note['effect']['ghostNote'] == false )
                                unset( $note['effect']['ghostNote'] );
                            if ( $note['effect']['palmMute'] == false )
                                unset( $note['effect']['palmMute'] );
                            if ( $note['effect']['staccato'] == false )
                                unset( $note['effect']['staccato'] );
                            if ( $note['effect']['harmonic'] == false )
                                unset( $note['effect']['harmonic'] );
                            if ( $note['effect']['vibrato'] == false )
                                unset( $note['effect']['vibrato'] );
                        }

                    } // for voices

                    // Mark first beat in the measure
                    if ( $this->beat_idx == 0 )
                    {
                        $this->gp_tabs['tracks'][$this->track_idx]
                        ['measures'][$this->measure_idx]
                        ['beats'][$this->beat_idx]['first_beat'] = true;
                    }

                    // Beat duration
                    $this->gp_tabs['tracks'][$this->track_idx]
                    ['measures'][$this->measure_idx]
                    ['beats'][$this->beat_idx]['duration']['backbeats'] = $max_duration['backbeats'];
                } // for beats
            } // for measures
        } // for tracks
    }
    /*********************************************************************************/
    private function SetupNoteHammer( &$note, $prev_hammer )
    {
        unset( $note['effect']['hammer'] );

        if ( $prev_hammer ) // если предыдущая нота была с хаммером
        {
            if ( $note['string'] == $prev_hammer['string'] ) // если струна совпадает
            {
                if ( $note['value'] > $prev_hammer['fret'] ) // лад увеличивается
                    $note['effect']['hammer'] = true;
                else
                    $note['effect']['pull'] = true;          // лад уменьшается - Пул
            }
        }
    }
    /*********************************************************************************/
    private function SetupNoteSlide( &$note, $measure_idx, $beat_idx, $voice_idx )
    {
        // берем сладующую ноту, чтобы выяснить ее лад
        $next_measure_idx = $measure_idx;
        $next_beat_idx = $beat_idx;

        if ( $this->GetNextBeat( $next_measure_idx, $next_beat_idx ))
        {
            // берем ноты следующего бита
            $notes = $this->gp_tabs['tracks'][$this->track_idx]
            ['measures'][$next_measure_idx]
            ['beats'][$next_beat_idx]
            ['voices'][$voice_idx]
            ['notes'];

            // Ищем ноту на той же струне
            $next_note = null;
            $found = false;

            for ( $i = 0; $i < count( $notes ); $i++ )
            {
                $next_note = $notes[$i];

                if ( $next_note['string'] == $note['string'] &&
                     $next_note['value'] != $note['value'] &&
                    $next_note['value'] != 0 ) // если номера ладов не совпадают, иначе слайд рисовать не нужно
                {
                    $direction = 1;

                    if ( $next_note['value'] < $note['value'] )
                        $direction = 0;

                    $note['effect']['slide'] = array( 'next_fret' => $next_note['value'] );
                    $found = true;
                    break;
                }
            } // for notes

            // TODO: Неподдерживаемые типы слайда. Надо связаться с TuxGuitar по этому поводу
            if ( !$found )
                $note['effect']['slide'] = false;
        } // if next beat
    }
    /*********************************************************************************/
}; // TabsConverter

/*********************************************************************************/

?>