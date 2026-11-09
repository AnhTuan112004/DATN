import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 md:p-12 max-w-2xl mx-auto my-8">
          <div className="bg-surface border-2 border-line rounded-2xl p-6 md:p-8 shadow-hard text-fg space-y-4">
            <div className="w-12 h-12 rounded-xl bg-peach border-2 border-line flex items-center justify-center text-ink">
              <AlertCircle className="w-6 h-6 text-ink" strokeWidth={2.5} />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted">
                Lỗi tải giao diện
              </span>
              <h2 className="text-xl font-bold text-fg">
                {this.props.fallbackTitle || 'Không thể hiển thị nội dung trang này'}
              </h2>
              <p className="text-xs text-muted leading-relaxed">
                Đã xảy ra sự cố trong quá trình kết xuất dữ liệu. Vui lòng tải lại trang hoặc quay về Bảng điều khiển.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="p-3 bg-surface-2 border border-line rounded-xl text-xs font-mono text-muted overflow-x-auto">
                {this.state.error.message}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="inline-flex items-center gap-2 px-4 py-2 bg-lime text-ink font-semibold text-xs rounded-xl border-2 border-line shadow-hard hover:translate-x-0.5 hover:translate-y-0.5 transition cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Tải lại trang</span>
              </button>

              <a
                href="/"
                className="inline-flex items-center gap-2 px-4 py-2 bg-surface text-fg font-semibold text-xs rounded-xl border-2 border-line shadow-hard hover:translate-x-0.5 hover:translate-y-0.5 transition"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Về Bảng điều khiển</span>
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
