<?php

use function Roots\view;

function register_table_block()
{
    register_block_type(
        WIS_PLUGIN_PATH . '/build/blocks/table-block',
        [
            'render_callback' => 'render_table_block_callback'
        ]
    );
}
add_action('init', 'register_table_block');

/**
 * Render Callback Function.
 *
 * @param array $attributes Block attributes.
 * @param array $attributes Block content.
 * @return string Rendered Html.
 */
function render_table_block_callback($attributes, $content)
{
    return view('blocks/table', ['attributes' => $attributes, 'content' => $content])->render();
}
