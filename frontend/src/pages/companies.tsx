import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, MapPin, Users, ChevronLeft, ChevronRight, Search, HelpCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { fetchCompanies, getUploadedFileUrl } from '@/lib/api';

const PAGE_SIZE = 12;

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCompanies();
      setCompanies(data);
      setFiltered(data);
    } catch (err: any) {
      setError(err.message || 'Lỗi tải danh sách công ty');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setSearch(q);
    setCurrentPage(1);
    if (!q.trim()) {
      setFiltered(companies);
    } else {
      const lower = q.toLowerCase();
      setFiltered(
        companies.filter(
          (c) =>
            c.companyName?.toLowerCase().includes(lower) ||
            c.location?.toLowerCase().includes(lower) ||
            c.industry?.toLowerCase().includes(lower),
        ),
      );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-extrabold text-foreground mb-2">Danh sách công ty</h1>
        <p className="text-muted-foreground text-sm">Khám phá các doanh nghiệp IT hàng đầu tuyển dụng nhân tài tiếng Hàn</p>
      </div>

      {/* Search */}
      <div className="relative max-w-md mb-8">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={handleSearch}
          placeholder="Tìm theo tên công ty, địa điểm, lĩnh vực..."
          className="pl-10 h-11 bg-card border-border text-sm"
        />
      </div>

      {/* Results count */}
      {!loading && (
        <div className="text-xs text-muted-foreground font-semibold mb-6">
          Tìm thấy <span className="text-primary font-extrabold">{filtered.length}</span> công ty
          {totalPages > 1 && <span className="ml-2 text-muted-foreground/70">— Trang {currentPage}/{totalPages}</span>}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1,2,3,4,5,6].map((i) => (
            <div key={i} className="h-48 rounded-2xl bg-card border border-border animate-pulse p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-secondary" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-2/3 bg-secondary rounded" />
                  <div className="h-3 w-1/2 bg-secondary rounded" />
                </div>
              </div>
              <div className="h-3 w-full bg-secondary rounded" />
              <div className="h-3 w-3/4 bg-secondary rounded" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-16 bg-card border border-dashed border-border rounded-2xl">
          <HelpCircle className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">{error}</p>
        </div>
      ) : paginated.length === 0 ? (
        <div className="text-center py-16 bg-card border border-dashed border-border rounded-2xl">
          <HelpCircle className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <h3 className="font-extrabold text-foreground mb-2">Không tìm thấy công ty nào</h3>
          <p className="text-muted-foreground text-xs">Thử từ khóa khác hoặc xóa bộ lọc</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {paginated.map((company) => (
            <Link
              key={company.companyId}
              to={`/companies/${company.companyId}`}
              className="group p-5 bg-card border border-border rounded-2xl hover:border-primary/40 hover:shadow-md transition-all"
            >
              <div className="flex items-start gap-3 mb-4">
                {company.logoUrl ? (
                  <img
                    src={getUploadedFileUrl(company.logoUrl)}
                    alt={company.companyName}
                    className="w-12 h-12 rounded-xl object-contain bg-background border border-border p-1"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center shrink-0">
                    <Building2 className="w-6 h-6 text-primary" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-foreground text-sm group-hover:text-primary transition-colors truncate">
                    {company.companyName}
                  </h3>
                  {company.industry && (
                    <span className="text-[10px] text-muted-foreground font-medium">{company.industry}</span>
                  )}
                  {company.isVerified && (
                    <span className="ml-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                      Đã xác thực
                    </span>
                  )}
                </div>
              </div>

              {company.description && (
                <p className="text-xs text-muted-foreground leading-relaxed mb-4 line-clamp-2">{company.description}</p>
              )}

              <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                {company.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />{company.location}
                  </span>
                )}
                {company.companySize && (
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />{company.companySize} nhân viên
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="mt-10 flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="rounded-lg gap-1.5 text-xs font-semibold"
          >
            <ChevronLeft className="w-4 h-4" />Trước
          </Button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
              .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('...');
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === '...' ? (
                  <span key={`e-${i}`} className="px-2 text-xs text-muted-foreground">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p as number)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                      currentPage === p
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30'
                    }`}
                  >
                    {p}
                  </button>
                ),
              )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="rounded-lg gap-1.5 text-xs font-semibold"
          >
            Tiếp<ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
