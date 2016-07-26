# Documentation

## Installation

`composer require somardesignstudios/silverstripe-mapdrawingfield`

## Configuration

### SilverStripe

Add your Google Maps API key to
`mysite/_config/config.yml`

```yml
MapDrawingField:
  api_key: 'YOUR_GOOGLE_MAPS_API_KEY'
```

## Usage

Currently this form field can only be used in the CMS

### Basic Usage

```php

$field = MapDrawingField::create('GeoshapeCoordinates');

```

### Kitchen Sink 

```php

$otherShapes = array(
	array(
		'coords' => '-40.89332925416116, 174.98785257339478
		-40.89377126107807, 174.98773455619812
		-40.89502427380917, 174.9895691871643
		-40.89544599443901, 174.99048113822937
		-40.89526757450063, 174.9915862083435
		-40.894626880755496, 174.992036819458
		-40.893621222363954, 174.99091029167175
		-40.8933211439149, 174.9902880191803
		-40.89331303366767, 174.98947262763977',
		'colour' => '#000'
	),
	array(
		'coords' => '-40.89461066058015, 174.98709082603455
		-40.89442412827785, 174.9870800971985
		-40.89498372360693, 174.9868869781494',
		'colour' => '#333'
	)
);

$marker = array('-37.196353', '175.074638');

$defaultCenter = array('-37.196353', '175.074638');

$defaultZoom = 7;

$field = MapDrawingField::create('GeoshapeCoordinates', '#fff', $otherShapes, true, $defaultCenter, #defaultZoom);

```


