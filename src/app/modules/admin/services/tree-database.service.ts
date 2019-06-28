import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export class PropertyNode {
  children: PropertyNode[];
  name: string;
  value: any;
  type: string;
  level: number;
  preview?: string;
}

@Injectable()
export class TreeDatabaseService {
  dataChange = new BehaviorSubject<PropertyNode[]>([]);

  get data(): PropertyNode[] {
    return this.dataChange.value;
  }

  constructor() {}

  initialize(initData: PropertyNode[]) {
    // Parse the string to json object.
    const dataObject = initData;

    // Build the tree nodes from Json object. The result is a list of `FileNode` with nested
    //     file node as children.
    const data = this.buildFileTree(dataObject, 0);

    // Notify the change.
    this.dataChange.next(data);
  }

  /**
   * Build the file structure tree. The `value` is the Json object, or a sub-tree of a Json object.
   * The return value is the list of `FileNode`.
   */
  buildFileTree(obj: { [key: string]: any }, level: number): PropertyNode[] {
    function objectPreview(value: object): string {
      var output = JSON.stringify(value);
      output = output
        .replace(/\"([^(\")"]+)\":/g, '$1: ')
        .replace(/(,)/, '$1 ');
      // ["5678901234567890123456"]
      if (output.length > 27) {
        output = output.substr(0, 26);
        output += '...';
        if (output.startsWith('{')) output += '}';
        if (output.startsWith('[')) output += ']';
      }
      return output;
    }

    function handleTimestamp(value: any) {
      if (typeof value === 'object') {
        if (value.constructor.name == 'Timestamp') {
          let date = new Date(value.seconds * 1000);
          return date.toLocaleDateString('de-DE', {
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric'
          });
        }
      }
      return value;
    }

    return Object.keys(obj).reduce<PropertyNode[]>((accumulator, key) => {
      var value = obj[key];
      const node = new PropertyNode();
      node.name = key;

      if (value != undefined) {
        if (typeof value === 'object') {
          value = handleTimestamp(value);
          if (typeof value === 'string') {
            node.value = value;
            node.type = 'Zeitstempel';
          } else if (value == null) {
            node.value = value;
            node.type = 'Null';
          } else {
            node.children = this.buildFileTree(value, level + 1);
            node.type = Array.isArray(value) ? 'Liste' : 'Objekt';
            node.preview = objectPreview(value);
          }
        } else {
          console.log(Array.isArray(value), value);
          var type: string = typeof value;
          switch (type) {
            case 'string':
              value = '"' + value + '"';
              type = 'Text';
              break;
            case 'boolean':
              type = 'Boolean';
              break;
            case 'number':
              type = 'Zahl';
              break;
          }
          node.type = type;
          node.value = value;
        }
        node.level = level;
      }

      return accumulator.concat(node);
    }, []);
  }
}
