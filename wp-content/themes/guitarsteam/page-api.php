<?php
/*
 * Template Name: API
 *
 * Created by Igor
 * Date: 11.01.2017
 */

include_once "inc/api.php"; // нужно сделать в виде виджета

$api = new gsAPI;

$api->ProcessCall();

?>