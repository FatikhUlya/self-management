declare module 'react-quill' {
  import * as React from 'react';
  
  export interface ReactQuillProps {
    theme?: string;
    value?: string;
    onChange?: (content: string, delta: any, source: string, editor: any) => void;
    placeholder?: string;
    className?: string;
    modules?: any;
    formats?: string[];
    readOnly?: boolean;
    bounds?: string | HTMLElement;
    scrollingContainer?: string | HTMLElement;
    preserveWhitespace?: boolean;
  }
  
  export default class ReactQuill extends React.Component<ReactQuillProps> {}
}
