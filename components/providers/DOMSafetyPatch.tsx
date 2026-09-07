"use client";

import { useEffect } from "react";

/**
 * DOMSafetyPatch
 *
 * Prevents React from throwing runtime NotFoundError:
 * "Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node."
 *
 * Root Cause:
 * Google Translate, Grammarly, Language Translators, and browser extensions mutate
 * or wrap text nodes in <font> tags. When React attempts to reconcile or unmount
 * nodes during client-side navigation, the target node's parent is no longer
 * what React expects, resulting in an unhandled crash.
 *
 * This safe polyfill guards removeChild and insertBefore against non-child mutations.
 */
export default function DOMSafetyPatch() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Patch removeChild
    const originalRemoveChild = Node.prototype.removeChild;
    Node.prototype.removeChild = function <T extends Node>(child: T): T {
      if (child.parentNode !== this) {
        if (process.env.NODE_ENV !== "production") {
          console.warn(
            "[DOMSafetyPatch] Suppressed invalid removeChild call on mutated node:",
            child
          );
        }
        return child;
      }
      return originalRemoveChild.call(this, child) as T;
    };

    // Patch insertBefore
    const originalInsertBefore = Node.prototype.insertBefore;
    Node.prototype.insertBefore = function <T extends Node>(
      newNode: T,
      referenceNode: Node | null
    ): T {
      if (referenceNode && referenceNode.parentNode !== this) {
        if (process.env.NODE_ENV !== "production") {
          console.warn(
            "[DOMSafetyPatch] Suppressed invalid insertBefore call on mutated node:",
            referenceNode
          );
        }
        return newNode;
      }
      return originalInsertBefore.call(this, newNode, referenceNode) as T;
    };
  }, []);

  return null;
}
