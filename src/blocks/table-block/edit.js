/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useEffect, useRef, useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import {
  InspectorControls,
  BlockControls,
  RichText,
  BlockIcon,
  useBlockProps,
  __experimentalUseColorProps as useColorProps,
  __experimentalUseBorderProps as useBorderProps,
  __experimentalGetElementClassName,
} from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import {
  Button,
  PanelBody,
  Placeholder,
  TextControl,
  ToggleControl,
  ToolbarDropdownMenu,
  __experimentalHasSplitBorders as hasSplitBorders,
} from '@wordpress/components';
import {
  alignLeft,
  alignRight,
  alignCenter,
  blockTable as icon,
  tableColumnAfter,
  tableColumnBefore,
  tableColumnDelete,
  tableRowAfter,
  tableRowBefore,
  tableRowDelete,
  table,
} from '@wordpress/icons';
import { createBlock, getDefaultBlockName } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import {
  createTable,
  updateSelectedCell,
  getCellAttribute,
  insertRow,
  deleteRow,
  insertColumn,
  deleteColumn,
  toggleSection,
  isEmptyTableSection,
} from './state';

const cellAriaLabel = {
  head: __('Header cell text'),
  body: __('Body cell text'),
  foot: __('Footer cell text'),
};

const placeholder = {
  head: __('Header label'),
  foot: __('Footer label'),
};

function TSection({ name, ...props }) {
  const TagName = `t${name}`;
  return <TagName {...props} />;
}

function TableEdit({
  attributes,
  setAttributes,
  isSelected,
}) {
  const { hasNumericColumn, head, foot } = attributes;
  const [initialRowCount, setInitialRowCount] = useState(2);
  const [initialColumnCount, setInitialColumnCount] = useState(2);
  const [selectedCell, setSelectedCell] = useState();

  const colorProps = useColorProps(attributes);
  const borderProps = useBorderProps(attributes);

  const selectedBlock = useSelect((select) => select('core/block-editor').getSelectedBlock());
  const allowedBlock = [
    'wis-blocks/table'
  ];

  const tableRef = useRef();
  const [hasTableCreated, setHasTableCreated] = useState(false);

  /**
   * Updates the initial column count used for table creation.
   *
   * @param {number} count New initial column count.
   */
  function onChangeInitialColumnCount(count) {
    setInitialColumnCount(count);
  }

  /**
   * Updates the initial row count used for table creation.
   *
   * @param {number} count New initial row count.
   */
  function onChangeInitialRowCount(count) {
    setInitialRowCount(count);
  }

  /**
   * Creates a table based on dimensions in local state.
   *
   * @param {Object} event Form submit event.
   */
  function onCreateTable(event) {
    event.preventDefault();

    setAttributes(
      createTable({
        rowCount: parseInt(initialRowCount, 10) || 2,
        columnCount: parseInt(initialColumnCount, 10) || 2,
      })
    );
    setHasTableCreated(true);
  }

  /**
   * Changes the content of the currently selected cell.
   *
   * @param {Array} content A RichText content value.
   */
  function onChange(content) {
    console.log('selectedCell');
    console.log(selectedCell);
    if (!selectedCell) {
      return;
    }

    setAttributes(
      updateSelectedCell(
        attributes,
        selectedCell,
        (cellAttributes) => ({
          ...cellAttributes,
          content,
        })
      )
    );
  }

  /**
   * Add or remove a `head` table section.
   */
  function onToggleHeaderSection() {
    setAttributes(toggleSection(attributes, 'head'));
  }

  /**
   * Add or remove a `foot` table section.
   */
  function onToggleFooterSection() {
    setAttributes(toggleSection(attributes, 'foot'));
  }

  /**
   * Inserts a row at the currently selected row index, plus `delta`.
   *
   * @param {number} delta Offset for selected row index at which to insert.
   */
  function onInsertRow(delta) {
    if (!selectedCell) {
      return;
    }

    const { sectionName, rowIndex } = selectedCell;
    const newRowIndex = rowIndex + delta;

    setAttributes(
      insertRow(attributes, {
        sectionName,
        rowIndex: newRowIndex,
      })
    );
    // Select the first cell of the new row.
    setSelectedCell({
      sectionName,
      rowIndex: newRowIndex,
      columnIndex: 0,
      type: 'cell',
    });
  }

  /**
   * Inserts a row before the currently selected row.
   */
  function onInsertRowBefore() {
    onInsertRow(0);
  }

  /**
   * Inserts a row after the currently selected row.
   */
  function onInsertRowAfter() {
    onInsertRow(1);
  }

  /**
   * Deletes the currently selected row.
   */
  function onDeleteRow() {
    if (!selectedCell) {
      return;
    }

    const { sectionName, rowIndex } = selectedCell;

    setSelectedCell();
    setAttributes(deleteRow(attributes, { sectionName, rowIndex }));
  }

  /**
   * Inserts a column at the currently selected column index, plus `delta`.
   *
   * @param {number} delta Offset for selected column index at which to insert.
   */
  function onInsertColumn(delta = 0) {
    if (!selectedCell) {
      return;
    }

    const { columnIndex } = selectedCell;
    const newColumnIndex = columnIndex + delta;

    setAttributes(
      insertColumn(attributes, {
        columnIndex: newColumnIndex,
      })
    );
    // Select the first cell of the new column.
    setSelectedCell({
      rowIndex: 0,
      columnIndex: newColumnIndex,
      type: 'cell',
    });
  }

  /**
   * Inserts a column before the currently selected column.
   */
  function onInsertColumnBefore() {
    onInsertColumn(0);
  }

  /**
   * Inserts a column after the currently selected column.
   */
  function onInsertColumnAfter() {
    onInsertColumn(1);
  }

  /**
   * Deletes the currently selected column.
   */
  function onDeleteColumn() {
    if (!selectedCell) {
      return;
    }

    const { sectionName, columnIndex } = selectedCell;

    setSelectedCell();
    setAttributes(
      deleteColumn(attributes, { sectionName, columnIndex })
    );
  }

  /**
   * Include first columns
   */
  function onChangeNumericColumn() {
    if (hasNumericColumn === true) {
      setAttributes(deleteColumn(attributes, { columnIndex: 0 }));
      setAttributes({ hasNumericColumn: false });
    }

    if (hasNumericColumn === false) {
      setAttributes(insertFirstColumn(attributes, { columnIndex: 0 }));
      setAttributes({ hasNumericColumn: true });
    }
  }

  useEffect(() => {
    if (!isSelected) {
      setSelectedCell();
    }
  }, [isSelected]);

  useEffect(() => {
    if (hasTableCreated) {
      tableRef?.current
        ?.querySelector('td div[contentEditable="true"]')
        ?.focus();
      setHasTableCreated(false);
    }
  }, [hasTableCreated]);

  const sections = ['head', 'body', 'foot'].filter(
    (name) => !isEmptyTableSection(attributes[name])
  );

  const tableControls = [
    {
      icon: tableRowBefore,
      title: __('Insert row before'),
      isDisabled: !selectedCell,
      onClick: onInsertRowBefore,
    },
    {
      icon: tableRowAfter,
      title: __('Insert row after'),
      isDisabled: !selectedCell,
      onClick: onInsertRowAfter,
    },
    {
      icon: tableRowDelete,
      title: __('Delete row'),
      isDisabled: !selectedCell,
      onClick: onDeleteRow,
    },
    {
      icon: tableColumnBefore,
      title: __('Insert column before'),
      isDisabled: !selectedCell,
      onClick: onInsertColumnBefore,
    },
    {
      icon: tableColumnAfter,
      title: __('Insert column after'),
      isDisabled: !selectedCell,
      onClick: onInsertColumnAfter,
    },
    {
      icon: tableColumnDelete,
      title: __('Delete column'),
      isDisabled: !selectedCell,
      onClick: onDeleteColumn,
    },
  ];

  if (selectedBlock !== null && allowedBlock.includes(selectedBlock.name)) {
    var tableElement = document.querySelector('.wp-block-wis-blocks-table');
    if (tableElement) {
      tableElement.addEventListener('mousedown', function (event) {
        if (event.target.tagName === 'DIV') {
          setSelectedCell();
        }
      });
    }
  }

  const renderedSections = sections.map((name) => (
    <TSection name={name} key={name}>
      {attributes[name].map(({ cells }, rowIndex) => (
        <tr key={rowIndex}>
          {cells.map(
            (
              {
                content,
                tag: CellTag,
                scope,
                align,
                colspan,
                rowspan,
              },
              columnIndex
            ) => (
              <RichText
                tagName={CellTag}
                key={columnIndex}
                className={classnames(
                  {
                    [`has-text-align-${align}`]: align,
                  },
                  (columnIndex === 0 && hasNumericColumn === true) ? 'first' : '',
                  'wp-block-table__cell-content'
                )}
                scope={CellTag === 'th' ? scope : undefined}
                colSpan={colspan}
                rowSpan={rowspan}
                value={content}
                onChange={onChange}
                onFocus={() => {
                  setSelectedCell({
                    sectionName: name,
                    rowIndex,
                    columnIndex,
                    type: 'cell',
                  });
                }}
                contentEditable={(columnIndex === 0 && hasNumericColumn === true) ? ['false'] : ['true']}
                aria-label={cellAriaLabel[name]}
                placeholder={(columnIndex === 0 && hasNumericColumn === true) ? '' : placeholder[name]}
              />
            )
          )}
        </tr>
      ))}
    </TSection>
  ));

  const isEmpty = !sections.length;

  return (
    <figure {...useBlockProps({ ref: tableRef })}>
      {!isEmpty && (
        <>
          <BlockControls group="other">
            <ToolbarDropdownMenu
              hasArrowIndicator
              icon={table}
              label={__('Edit table')}
              controls={tableControls}
            />
          </BlockControls>
        </>
      )}
      <InspectorControls>
        <PanelBody
          title={__('Settings')}
          className="blocks-table-settings"
        >
          {!isEmpty && (
            <>
              <ToggleControl
                __nextHasNoMarginBottom
                label={__('Header section')}
                checked={!!(head && head.length)}
                onChange={onToggleHeaderSection}
              />
              <ToggleControl
                label='Add row numbers'
                checked={!!hasNumericColumn}
                onChange={onChangeNumericColumn}
                help='Include additional column with row numbers'
              />
              <ToggleControl
                __nextHasNoMarginBottom
                label={__('Footer section')}
                checked={!!(foot && foot.length)}
                onChange={onToggleFooterSection}
              />
            </>
          )}
        </PanelBody>
      </InspectorControls>
      {!isEmpty && (
        <table
          className={classnames(
            colorProps.className,
            borderProps.className,
            {
              // This is required in the editor only to overcome
              // the fact the editor rewrites individual border
              // widths into a shorthand format.
              'has-individual-borders': hasSplitBorders(
                attributes?.style?.border
              ),
            },
            'table w-full'
          )}
          style={{ ...colorProps.style, ...borderProps.style }}
        >
          {renderedSections}
        </table>
      )}
    </figure>
  );
}

export default TableEdit;
