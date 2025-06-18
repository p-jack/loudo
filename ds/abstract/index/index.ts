import { mixin } from "loudo-mixin"
import { SetBase, SetRemove } from "loudo-ds-set-interfaces"

export abstract class IndexBase<K extends {},V extends {}> {
  abstract get index():(v:V)=>K
  abstract get(key:K):V|undefined
  hasKey(key:K):boolean { return this.get(key) !== undefined }
  has(value:V) {
    const k = this.get(this.index(value))
    return k !== undefined
  }
}
export interface IndexBase<K extends {},V extends {}> extends SetBase<V> {}
mixin(IndexBase, [SetBase])


export abstract class IndexRemove<K extends {},V extends {}> {
  abstract removeKey(key:K):V|undefined
  remove(v:V):boolean {
    const k = this.index(v)
    const old = this.removeKey(k)
    return old !== undefined
  }
}
export interface IndexRemove<K extends {},V extends {}> extends IndexBase<K,V>, SetRemove<V> {}
mixin(IndexRemove, [IndexBase, SetRemove])
