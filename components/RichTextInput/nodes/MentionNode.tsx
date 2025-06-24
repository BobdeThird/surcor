import React from 'react';
import {
  $applyNodeReplacement,
  DecoratorNode,
  EditorConfig,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from 'lexical';

export type SerializedMentionNode = Spread<
  {
    mentionName: string;
    mentionId: string;
  },
  SerializedLexicalNode
>;

export class MentionNode extends DecoratorNode<React.JSX.Element> {
  __mentionName: string;
  __mentionId: string;

  static getType(): string {
    return 'mention';
  }

  static clone(node: MentionNode): MentionNode {
    return new MentionNode(node.__mentionName, node.__mentionId, node.__key);
  }

  constructor(mentionName: string, mentionId: string, key?: NodeKey) {
    super(key);
    this.__mentionName = mentionName;
    this.__mentionId = mentionId;
  }

  createDOM(config: EditorConfig): HTMLSpanElement {
    const span = document.createElement('span');
    span.className = 'mention-chip';
    span.contentEditable = 'false';
    return span;
  }

  updateDOM(): false {
    return false;
  }

  static importJSON(serializedNode: SerializedMentionNode): MentionNode {
    const { mentionName, mentionId } = serializedNode;
    return new MentionNode(mentionName, mentionId);
  }

  exportJSON(): SerializedMentionNode {
    return {
      ...super.exportJSON(),
      mentionName: this.__mentionName,
      mentionId: this.__mentionId,
      type: 'mention',
      version: 1,
    };
  }

  getTextContent(): string {
    return `@${this.__mentionName}`;
  }

  getMentionName(): string {
    return this.__mentionName;
  }

  getMentionId(): string {
    return this.__mentionId;
  }

  decorate(): React.JSX.Element {
    return (
      <span className="inline-flex items-center gap-1 px-1 mx-0.5 bg-blue-100 text-blue-900 rounded-md text-sm select-none cursor-default">
        <span>@{this.__mentionName}</span>
      </span>
    );
  }
}

export function $createMentionNode(
  mentionName: string,
  mentionId: string,
): MentionNode {
  const node = new MentionNode(mentionName, mentionId);
  return $applyNodeReplacement(node);
}

export function $isMentionNode(
  node: LexicalNode | null | undefined,
): node is MentionNode {
  return node instanceof MentionNode;
} 