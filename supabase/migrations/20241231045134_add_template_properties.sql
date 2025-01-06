-- Add default template properties to existing templates
UPDATE templates
SET design_data = jsonb_set(
  COALESCE(design_data, '{}'::jsonb),
  '{properties}',
  '{
    "size": {
      "width": 8.5,
      "height": 11,
      "unit": "in"
    },
    "orientation": "portrait",
    "background": {
      "type": "color",
      "value": "#ffffff"
    },
    "margins": {
      "top": 0.5,
      "right": 0.5,
      "bottom": 0.5,
      "left": 0.5,
      "unit": "in"
    },
    "padding": {
      "top": 0.25,
      "right": 0.25,
      "bottom": 0.25,
      "left": 0.25,
      "unit": "in"
    }
  }'::jsonb
)
WHERE design_data->>'properties' IS NULL;
