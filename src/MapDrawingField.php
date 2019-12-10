<?php

namespace Somar;

use SilverStripe\Forms\FormField;
use SilverStripe\Core\Convert;
use SilverStripe\Core\Config\Config;
use SilverStripe\View\Requirements;

class MapDrawingField extends FormField
{
    /**
     * @var string
     */
    protected $colour;

    /**
     * @var array
     */
    protected $shapes;

    /**
     * @var bool
     */
    protected $readonly;

    /**
     * @var array
     */
    protected $marker;

    /**
     * @var array
     */
    protected $center;

    /**
     * @var int
     */
    protected $zoom;

    /**
     * @param string $name
     * @param string $title
     * @param string $colour
     * @param array $shapes
     * @param bool $readonly
     * @param array $marker
     * @param array $defaultCenter
     * @param int $defaultZoom
     */
    public function __construct($name, $title = null, $colour = '#000', $shapes = [], $readonly = false, $marker = [], $center = [0, 0], $zoom = 7)
    {
        $this->colour = $colour;
        $this->shapes = $shapes;
        $this->readonly = $readonly;
        $this->marker = $marker;
        $this->center = $center;
        $this->zoom = $zoom;

        parent::__construct($name, $title, $value = null);
    }

    /**
     * Set the colour of the shape
     *
     * @param string $colour
     */
    public function setColour($colour)
    {
        $this->colour = $colour;

        return $this;
    }

    /**
     * Alias of setColour
     *
     * @param string $color
     */
    public function setColor($color)
    {
        return $this->setColour($color);
    }

    /**
     * Set the readonly setting
     *
     * @param bool $readonly
     */
    public function setReadonly($readonly)
    {
        $this->readonly = $readonly;

        return $this;
    }

    /**
     * Set the default zoom setting
     *
     * @param int $zoom
     */
    public function setZoom($zoom)
    {
        $this->zoom = $zoom;

        return $this;
    }

    /**
     * Set the default center coordinates
     *
     * @param array $center
     */
    public function setCenter($center)
    {
        $this->center = $center;

        return $this;
    }

    /**
     * Set the marker coordinates
     *
     * @param array $marker
     */
    public function setMarker($marker)
    {
        $this->marker = $marker;

        return $this;
    }

    /**
     * Set an array of 'other shapes' on the map
     * @param array $shapes the coordinates for the marker
     */
    public function setShapes($shapes)
    {
        $this->shapes = $shapes;

        return $this;
    }

    public function getAttributes()
    {
        $attributes = parent::getAttributes();

        unset($attributes['value']);

        return $attributes;
    }

    public function Field($properties = [])
    {
        $settings = [
            'map' => [
                'zoom' => (int) $this->zoom,
                'coords' => $this->center,
                'colour' => $this->colour,
                'marker' => $this->marker,
            ],
            'shapes' => $this->shapes,
            'readonly' => (bool) $this->readonly,
            'labels' => [
                'DELETEPOINT' => _t(MapDrawingField::class . '.DELETEPOINT', 'Delete')
            ]
        ];

        $this->setAttribute('data-settings', Convert::array2json($settings));
        $this->requireDependencies();

        return parent::Field($properties);
    }

    protected function requireDependencies()
    {
        $gmapsParams = [
            'key' => Config::inst()->get(MapDrawingField::class, 'api_key'),
            'libraries' => 'drawing',
            'callback' => 'mapDrawingFieldInit',
        ];

        Requirements::javascript('somardesignstudios/silverstripe-mapdrawingfield:client/dist/js/mapdrawingfield.js');
        Requirements::javascript('https://maps.googleapis.com/maps/api/js?' . http_build_query($gmapsParams));
    }
}
