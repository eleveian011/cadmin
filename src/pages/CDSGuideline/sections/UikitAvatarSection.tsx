// @ts-nocheck
import { CdsAvatar } from '../../../components/cds'

export default function UikitAvatarSection() {
  return (
    <section className="space-y-4">
      <h3 className="type-body font-semibold text-(--text)">Avatar</h3>

      <div className="space-y-2">
        <p className="type-caption font-medium text-(--muted)">Sizes</p>
        <div className="flex items-end gap-4">
          <CdsAvatar size="sm" name="Alex Wang" />
          <CdsAvatar size="md" name="Alex Wang" />
          <CdsAvatar size="lg" name="Alex Wang" />
        </div>
      </div>

      <div className="space-y-2">
        <p className="type-caption font-medium text-(--muted)">Shapes</p>
        <div className="flex items-center gap-4">
          <CdsAvatar size="md" shape="circle" name="Alex Wang" />
          <CdsAvatar size="md" shape="square" name="Alex Wang" />
          <CdsAvatar size="lg" shape="circle" name="Super Admin" />
          <CdsAvatar size="lg" shape="square" name="Super Admin" />
        </div>
      </div>

      <div className="space-y-2">
        <p className="type-caption font-medium text-(--muted)">Badge</p>
        <div className="flex items-center gap-4">
          <CdsAvatar size="sm" name="Alex Wang" badge />
          <CdsAvatar size="md" name="Alex Wang" badge />
          <CdsAvatar size="lg" name="Alex Wang" badge />
          <CdsAvatar size="md" shape="square" name="Alex Wang" badge />
        </div>
      </div>

      <div className="space-y-2">
        <p className="type-caption font-medium text-(--muted)">Colors</p>
        <div className="flex items-center gap-4">
          <CdsAvatar size="md" name="PayFlow" color="#4f46e5" />
          <CdsAvatar size="md" name="Alibaba" color="#ff6a00" />
          <CdsAvatar size="md" name="JP Morgan" color="#0f172a" />
          <CdsAvatar size="md" name="Green" color="#0e7a5a" />
        </div>
      </div>

      <div className="space-y-2">
        <p className="type-caption font-medium text-(--muted)">Image source</p>
        <div className="flex items-center gap-4">
          <CdsAvatar size="sm" shape="circle" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' fill='%234f46e5'/%3E%3Ccircle cx='20' cy='14' r='8' fill='%23e0e7ff'/%3E%3Cellipse cx='20' cy='38' rx='15' ry='10' fill='%23e0e7ff'/%3E%3C/svg%3E" name="Photo" />
          <CdsAvatar size="md" shape="circle" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' fill='%234f46e5'/%3E%3Ccircle cx='20' cy='14' r='8' fill='%23e0e7ff'/%3E%3Cellipse cx='20' cy='38' rx='15' ry='10' fill='%23e0e7ff'/%3E%3C/svg%3E" name="Photo" />
          <CdsAvatar size="lg" shape="square" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' fill='%234f46e5'/%3E%3Ccircle cx='20' cy='14' r='8' fill='%23e0e7ff'/%3E%3Cellipse cx='20' cy='38' rx='15' ry='10' fill='%23e0e7ff'/%3E%3C/svg%3E" name="Photo" badge />
        </div>
      </div>
    </section>
  )
}
