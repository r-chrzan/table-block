/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
  RichText,
  useBlockProps,
  __experimentalGetBorderClassesAndStyles as getBorderClassesAndStyles,
  __experimentalGetColorClassesAndStyles as getColorClassesAndStyles,
  __experimentalGetElementClassName,
} from '@wordpress/block-editor';

export default function save({ attributes }) {
  const { hasNumericColumn, head, body, foot } = attributes;
  const isEmpty = !head.length && !body.length && !foot.length;

  if (isEmpty) {
    return null;
  }

  const colorProps = getColorClassesAndStyles(attributes);
  const borderProps = getBorderClassesAndStyles(attributes);

  const classes = classnames(colorProps.className, borderProps.className);

  const Section = ({ type, rows }) => {
    if (!rows.length) {
      return null;
    }

    const Tag = `t${type}`;

    return (
      <Tag>
        {rows.map(({ cells }, rowIndex) => (
          <tr key={rowIndex}>
            {cells.map(
              (
                {
                  content,
                  tag,
                  scope,
                  align,
                },
                cellIndex
              ) => {
                const cellClasses = classnames({
                  [`has-text-align-${align}`]: align,
                }, (cellIndex === 0 && hasNumericColumn === true) ? 'first' : '');

                return (
                  <RichText.Content
                    className={
                      cellClasses
                        ? cellClasses
                        : undefined
                    }
                    data-align={align}
                    tagName={tag}
                    value={content}
                    key={cellIndex}
                    scope={
                      tag === 'th' ? scope : undefined
                    }
                  />
                );
              }
            )}
          </tr>
        ))}
      </Tag>
    );
  };

  return (
    <figure {...useBlockProps.save()}>
      <table
        className={classes === '' ? '' : classes}
        style={{ ...colorProps.style, ...borderProps.style }}
      >
        <Section type="head" rows={head} />
        <Section type="body" rows={body} />
        <Section type="foot" rows={foot} />
      </table>
    </figure>
  );
}
