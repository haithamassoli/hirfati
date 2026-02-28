import { Wrench } from "lucide-react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-neutral-900 text-neutral-400 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center">
                <Wrench className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-bold text-white">حرفتي</span>
            </div>
            <p className="text-sm leading-relaxed">
              منصة تربط الحرفيين المهرة بالعملاء في الأردن. سباكة، كهرباء، نجارة
              وأكثر.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">روابط سريعة</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/categories"
                  className="hover:text-white transition-colors"
                >
                  التصنيفات
                </Link>
              </li>
              <li>
                <Link
                  href="/requests"
                  className="hover:text-white transition-colors"
                >
                  طلبات الخدمة
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="hover:text-white transition-colors"
                >
                  عن حرفتي
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">المدن</h4>
            <ul className="space-y-2 text-sm">
              <li>عمّان</li>
              <li>إربد</li>
              <li>الزرقاء</li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">التصنيفات</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/categories/plumbing"
                  className="hover:text-white transition-colors"
                >
                  سباكة
                </Link>
              </li>
              <li>
                <Link
                  href="/categories/electrical"
                  className="hover:text-white transition-colors"
                >
                  كهرباء
                </Link>
              </li>
              <li>
                <Link
                  href="/categories/carpentry"
                  className="hover:text-white transition-colors"
                >
                  نجارة
                </Link>
              </li>
              <li>
                <Link
                  href="/categories/general-maintenance"
                  className="hover:text-white transition-colors"
                >
                  صيانة عامة
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-neutral-800 mt-10 pt-6 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} حرفتي. جميع الحقوق محفوظة.</p>
        </div>
      </div>
    </footer>
  );
}
