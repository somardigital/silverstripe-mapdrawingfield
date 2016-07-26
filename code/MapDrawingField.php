<?php

class MapDrawingField extends FormField{

	/**
	* @var array
	*/
	protected $defaultCenter;
	/**
	* @var int
	*/
	protected $defaultZoom;
	/**
	* @var string
	*/
	protected $colour;
	/**
	* @var boolean
	*/
	protected $readonly;
	/**
	* @var array
	*/
	protected $marker;
	/**
	* @var array
	*/
	protected $shapes;


	/**
	*
	* @param string $name The name of the field
    * @param string $colour The colour of the shape
	* @param array $otherShapes An array of paths you want to also display on the map
	* @param boolean $readonly Whether or not this is readonly
	* @param array $marker The coordinates for a marker
	* @param array $defaultCenter The default center of the map
	* @param int $defaultZoom The default zoom for the map
	*
	*/
	public function __construct($name, $colour = 'black', $otherShapes = array(), $readonly = false, $marker = array(), $defaultCenter = array('-37.196353', '175.074638'), $defaultZoom = 7){
		$this->colour = $colour;
		$this->readonly = $readonly;
		$this->defaultCenter = $defaultCenter;
		$this->defaultZoom = $defaultZoom;
		$this->marker = $marker;
		$this->shapes = $otherShapes;

		parent::__construct($name, $title = null, $value = null);
	}


	/**
	* Sets the colour of the shape
	* @param string $colour The colour of the shape
	*/
	public function setColour($colour){
		$this->colour = $colour;
	}

	/**
	* Sets the readonly setting
	* @param boolean $readonly Whether or not this readonly
	*/
	public function setReadonly($readonly){
		$this->readonly = $readonly;
	}

	/**
	* Sets the readonly setting
	* @param boolean $readonly Whether or not this readonly
	*/
	public function setDefaultZoom($zoom){
		$this->defaultZoom = $zoom;
	}

	/**
	* Sets the readonly setting
	* @param boolean $readonly Whether or not this readonly
	*/
	public function setDefaultCenter($center){
		$this->defaultCenter = $center;
	}

	/**
	* Sets the a marker on a map
	* @param array $marker the coordinates for the marker
	*/
	public function getMarker($marker){
		$this->marker = $marker;
	}

	/**
	* Set an array of 'other shapes' on the map
	* @param array $shapes the coordinates for the marker
	*/
	public function setShapes($shapes){
		$this->shapes = $shapes;
	}

	public function getAttributes() {
		$attributes = parent::getAttributes();
		unset($attributes['value']);
		return $attributes;	
	}

	public function Field($properties = array()){
		$settings = array(
			'map' => array(
				'zoom' => $this->defaultZoom,
				'coords' => $this->defaultCenter,
				'colour' => $this->colour,
				'marker' => $this->marker
			),
			'shapes' => $this->shapes,
			'readonly' => $this->readonly
		);

		$this->setAttribute('data-settings', Convert::array2json($settings));
		$this->requireDependencies();
			
		return parent::Field($properties);	
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