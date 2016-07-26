<?php

class MapDrawingField extends FormField{

	protected $defaultCenter;
	protected $defaultZoom;
	protected $colour;
	protected $readonly;
	protected $marker;
	protected $shapes;

	public function __construct($name, $colour, $otherShapes = array(), $readonly = false, $marker = array(), $defaultCenter = array('-37.196353', '175.074638'), $defaultZoom = 7){
		$this->colour = $colour;
		$this->readonly = $readonly;
		$this->defaultCenter = $defaultCenter;
		$this->defaultZoom = $defaultZoom;
		$this->marker = $marker;
		$this->shapes = $otherShapes;

		parent::__construct($name, $title = null, $value = null);
	}

	public function Field($properties = array()){
		$settings = array(
			'map' => array(
				'zoom' => $this->defaultZoom,
				'coords' => $this->defaultCenter,
				'colour' => ($this->colour) ? $this->colour : 'black',
				'marker' => $this->marker
			),
			'shapes' => $this->shapes,
			'readonly' => $this->readonly
		);

		$this->setAttribute('data-settings', Convert::array2json($settings));
		$this->requireDependencies();
			
		return parent::Field($properties);	
	}

	public function getAttributes() {
		$attributes = parent::getAttributes();
		unset($attributes['value']);
		return $attributes;	
	}

	protected function requireDependencies() {
		$gmapsParams = array(
			'libraries' => 'drawing',
			'callback' => 'mapdrawInit'

		);
		if($key = Config::inst()->get('MapDrawingField', 'api_key')) {
			$gmapsParams['key'] = $key;
		}
	
		Requirements::javascript(MAP_DRAWING_FIELD_DIR.'/js/mapdrawingfield.js');
		Requirements::javascript('//maps.googleapis.com/maps/api/js?' . http_build_query($gmapsParams));
	}
}