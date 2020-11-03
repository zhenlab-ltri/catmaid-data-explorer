import React from 'react';
import { VariableSizeGrid as Grid } from 'react-window';

// import './styles.css';

var focusField;

class CellInput extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      changed: false,
    };
  }

  // The cell value has changed
  onChange(event) {
    this.setState({
      changed: true,
    });
  }

  // Blur the input field if the 'Enter' key is pressed
  onKeyPress(event) {
    if (event.which === 13) {
      event.target.blur();
    }
    return false;
  }

  // The cell has gained focus
  onFocus(event) {
    focusField = event.target.id;
  }

  // The cell lost focus; i.e. was blurred
  onBlur(event) {
    if (this.state.changed) {
      if (this.props.cellChange === undefined)
        event.target.value = this.props.defaultValue;
      else this.props.cellChange(this.props, event.target.value);
      this.setState({
        changed: false,
      });
    }
  }

  render() {
    return React.createElement('input', {
      id: this.props.id,
      className: this.props.className,
      style: this.props.style,
      type: this.props.type,
      defaultValue: this.props.defaultValue,
      onChange: this.onChange.bind(this),
      onKeyPress: this.onKeyPress.bind(this),
      onFocus: this.onFocus.bind(this),
      onBlur: this.onBlur.bind(this),
    });
  }
}

const getRenderedCursor = (children) =>
  children.reduce(
    (
      [minRow, maxRow, minColumn, maxColumn],
      { props: { columnIndex, rowIndex } }
    ) => {
      if (rowIndex < minRow) {
        minRow = rowIndex;
      }

      if (rowIndex > maxRow) {
        maxRow = rowIndex;
      }

      if (columnIndex < minColumn) {
        minColumn = columnIndex;
      }

      if (columnIndex > maxColumn) {
        maxColumn = columnIndex;
      }

      return [minRow, maxRow, minColumn, maxColumn];
    },
    [
      Number.POSITIVE_INFINITY,
      Number.NEGATIVE_INFINITY,
      Number.POSITIVE_INFINITY,
      Number.NEGATIVE_INFINITY,
    ]
  );

const headerBuilder = (minColumn, maxColumn, columnWidth, stickyHeight) => {
  const columns = [];
  let left = [0],
    pos = 0;

  for (let c = 1; c <= maxColumn; c++) {
    pos += columnWidth(c - 1);
    left.push(pos);
  }

  for (let i = minColumn; i <= maxColumn; i++) {
    columns.push({
      height: stickyHeight,
      width: columnWidth(i),
      left: left[i],
      label: `Sticky Col ${i}`,
    });
  }

  return columns;
};

const columnsBuilder = (minRow, maxRow, rowHeight, stickyWidth) => {
  const rows = [];
  let top = [0],
    pos = 0;

  for (let c = 1; c <= maxRow; c++) {
    pos += rowHeight(c - 1);
    top.push(pos);
  }

  for (let i = minRow; i <= maxRow; i++) {
    rows.push({
      height: rowHeight(i),
      width: stickyWidth,
      top: top[i],
      label: `Sticky Row ${i}`,
    });
  }

  return rows;
};

export const GridColumn = ({ rowIndex, columnIndex, style }) => {
  let value = 'Cell ' + rowIndex + ', ' + columnIndex;
  return React.createElement(CellInput, {
    id: rowIndex + 1 + ',' + (columnIndex + 1),
    className: 'sticky-grid__data__column',
    style: style,
    type: 'text',
    defaultValue: value,
    cellChange: handleCellChange,
  });
};

const StickyHeader = ({ stickyHeight, stickyWidth, headerColumns }) => {
  const baseStyle = {
    height: stickyHeight,
    width: stickyWidth,
  };
  const scrollableStyle = {
    left: stickyWidth,
  };
  return React.createElement(
    'div',
    {
      className: 'sticky-grid__header',
    },
    React.createElement(
      'div',
      {
        className: 'sticky-grid__header__base',
        style: baseStyle,
      },
      'Sticky Base'
    ),
    React.createElement(
      'div',
      {
        className: 'sticky-grid__header__scrollable',
        style: scrollableStyle,
      },
      headerColumns.map(({ label, ...style }, i) =>
        React.createElement(
          'div',
          {
            className: 'sticky-grid__header__scrollable__column',
            style: style,
            key: i,
          },
          label
        )
      )
    )
  );
};

const StickyColumns = ({ rows, stickyHeight, stickyWidth }) => {
  const leftSideStyle = {
    top: stickyHeight,
    width: stickyWidth,
    height: `calc(100% - ${stickyHeight}px)`,
  };
  return React.createElement(
    'div',
    {
      className: 'sticky-grid__sticky-columns__container',
      style: leftSideStyle,
    },
    rows.map(({ label, ...style }, i) =>
      React.createElement(
        'div',
        {
          className: 'sticky-grid__sticky-columns__row',
          style: style,
          key: i,
        },
        label
      )
    )
  );
};

const StickyGridContext = React.createContext();
StickyGridContext.displayName = 'StickyGridContext';
const innerGridElementType = React.forwardRef(({ children, ...rest }, ref) =>
  React.createElement(
    StickyGridContext.Consumer,
    null,
    ({
      stickyHeight,
      stickyWidth,
      headerBuilder,
      columnsBuilder,
      columnWidth,
      rowHeight,
    }) => {
      const [minRow, maxRow, minColumn, maxColumn] = getRenderedCursor(
        children
      ); // TODO maybe there is more elegant way to get this

      const headerColumns = headerBuilder(
        minColumn,
        maxColumn,
        columnWidth,
        stickyHeight
      );
      const leftSideRows = columnsBuilder(
        minRow,
        maxRow,
        rowHeight,
        stickyWidth
      );
      const containerStyle = {
        ...rest.style,
        width: `${parseFloat(rest.style.width) + stickyWidth}px`,
        height: `${parseFloat(rest.style.height) + stickyHeight}px`,
      };
      const containerProps = {
        ...rest,
        style: containerStyle,
      };
      const gridDataContainerStyle = {
        top: stickyHeight,
        left: stickyWidth,
      };
      return React.createElement(
        'div',
        {
          className: 'sticky-grid__container',
          ref: ref,
          ...containerProps,
        },
        React.createElement(StickyHeader, {
          headerColumns: headerColumns,
          stickyHeight: stickyHeight,
          stickyWidth: stickyWidth,
        }),
        React.createElement(StickyColumns, {
          rows: leftSideRows,
          stickyHeight: stickyHeight,
          stickyWidth: stickyWidth,
        }),
        React.createElement(
          'div',
          {
            className: 'sticky-grid__data__container',
            style: gridDataContainerStyle,
          },
          children
        )
      );
    }
  )
);

export const StickyGrid = ({
  stickyHeight,
  stickyWidth,
  columnWidth,
  rowHeight,
  children,
  ...rest
}) =>
  React.createElement(
    StickyGridContext.Provider,
    {
      value: {
        stickyHeight,
        stickyWidth,
        columnWidth,
        rowHeight,
        headerBuilder,
        columnsBuilder,
      },
    },
    React.createElement(
      Grid,
      {
        columnWidth: columnWidth,
        rowHeight: rowHeight,
        innerElementType: innerGridElementType,
        ...rest,
      },
      children
    )
  );
