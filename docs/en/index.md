# Documentation

## Installation

```
$ composer require somardesignstudios/silverstripe-mapdrawingfield
```

## Configuration

### SilverStripe

Add your Google Maps API key to
`mysite/_config/config.yml`

```yml
Somar\MapDrawingField:
  api_key: 'YOUR_GOOGLE_MAPS_API_KEY'
```

## Usage

Currently this form field can only be used in the CMS

### Basic Usage

```php
<?php

use Somar\MapDrawingField;

$field = MapDrawingField::create('GeoshapeCoordinates', 'Region'); // You can now set the field title in the constructor

```

### Kitchen Sink 

```php
<?php

use Somar\MapDrawingField;

$otherShapes = [
    [
        'colour' => '#6d55aa',
        'coords' => '-41.28996356575425,174.78101145006872
            -41.290672967735716,174.78100072123266
            -41.29112440134403,174.78240619875646
            -41.2896814150948,174.78308211542821
            -41.28951212411342,174.78283535219884
            -41.29018122400067,174.78171955324865',
    ],
    [
        'colour' => '#358d88',
        'coords' => '...'
    ]
];

$field = MapDrawingField::create('GeoshapeCoordinates', 'Region');
$field->setReadonly(true); // If true, the field shape is not drawn and the drawing tools are disabled
$field->setCenter([-41.286461, 174.776230]); // The default center position
$field->setMarker([-41.286461, 174.776230]); // The marker position overwrites the center position
$field->setColour('#fcd708'); // The colour of the field shape to draw
$field->setShapes($otherShapes); // The shape boundaries overwrite the marker/center positions

```
