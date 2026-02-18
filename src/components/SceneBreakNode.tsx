import { DecoratorNode } from 'lexical';
import { NodeKey } from 'lexical';

export class SceneBreakNode extends DecoratorNode<React.ReactElement> {
  static getType(): string {
    return 'scene-break';
  }

  static clone(node: SceneBreakNode): SceneBreakNode {
    return new SceneBreakNode(node.__key);
  }

  createDOM(): HTMLElement {
    const el = document.createElement('div');
    el.className = 'editor-scene-break';
    return el;
  }

  updateDOM(): false {
    return false;
  }

  decorate(): React.ReactElement {
    return <SceneBreakComponent />;
  }

  isInline(): boolean {
    return false;
  }
}

const SceneBreakComponent = () => {
  return (
    <div className="editor-scene-break-visual">
      <div className="scene-break-line" />
      <div className="scene-break-icon">✦</div>
    </div>
  );
};
