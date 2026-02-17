import React, { useRef, useState } from 'react';
import { Download, Upload, Shield, AlertTriangle, CheckCircle, Database, FileJson, RefreshCw, Server } from 'lucide-react';
import { User, Room, Meeting, Document } from '../types';

interface SystemData {
  users: User[];
  rooms: Room[];
  meetings: Meeting[];
  documents: Document[];
}

interface SystemSettingsProps {
  currentUser: User;
  currentData: SystemData;
  onRestore: (data: SystemData) => Promise<void>;
}

export const SystemSettings: React.FC<SystemSettingsProps> = ({ currentUser, currentData, onRestore }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  if (currentUser.role !== 'admin') {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <div className="text-center max-w-md bg-white p-8 rounded-2xl shadow-sm border border-red-100">
           <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-red-500" />
           </div>
           <h2 className="text-xl font-bold text-gray-800 mb-2">Quyền Truy Cập Bị Từ Chối</h2>
           <p className="text-gray-500">Chức năng quản trị hệ thống chỉ dành cho tài khoản Admin.</p>
        </div>
      </div>
    );
  }

  const handleBackup = () => {
    try {
      const backupData = {
        version: '6.0',
        timestamp: new Date().toISOString(),
        exportedBy: currentUser.email,
        data: currentData
      };

      const jsonString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `ecabinet_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setMessage({ type: 'success', text: 'Sao lưu hệ thống thành công!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Backup failed:', error);
      setMessage({ type: 'error', text: 'Có lỗi xảy ra khi tạo file sao lưu.' });
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const jsonContent = e.target?.result as string;
        const parsed = JSON.parse(jsonContent);

        if (!parsed.data || !parsed.version) {
          throw new Error('File không hợp lệ hoặc sai định dạng.');
        }

        if (window.confirm(`Bạn có chắc chắn muốn khôi phục dữ liệu từ phiên bản ${parsed.version} (${parsed.timestamp})? \nDữ liệu hiện tại sẽ bị ghi đè.`)) {
          setIsRestoring(true);
          await onRestore(parsed.data);
          setIsRestoring(false);
          setMessage({ type: 'success', text: 'Khôi phục hệ thống hoàn tất!' });
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      } catch (error: any) {
        console.error('Restore failed:', error);
        setMessage({ type: 'error', text: `Lỗi khôi phục: ${error.message}` });
        setIsRestoring(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-black text-slate-800 tracking-tight">Cấu Hình Hệ Thống</h2>
        <p className="text-slate-500 mt-1">Sao lưu và khôi phục dữ liệu eCabinet</p>
      </div>

      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Backup Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col h-full">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
             <Download className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Sao Lưu Dữ Liệu</h3>
          <p className="text-sm text-gray-500 mb-6 flex-1">
            Xuất toàn bộ cấu hình người dùng, phòng họp, lịch họp và danh sách tài liệu ra file JSON. 
            <br/><span className="text-orange-500 text-xs font-bold mt-2 inline-block">* Lưu ý: Không bao gồm nội dung file tài liệu đính kèm.</span>
          </p>
          
          <div className="bg-slate-50 p-4 rounded-lg mb-6 text-xs space-y-2 text-slate-600 font-mono">
             <div className="flex justify-between"><span>Users:</span> <span className="font-bold">{currentData.users.length} records</span></div>
             <div className="flex justify-between"><span>Meetings:</span> <span className="font-bold">{currentData.meetings.length} records</span></div>
             <div className="flex justify-between"><span>Rooms:</span> <span className="font-bold">{currentData.rooms.length} records</span></div>
             <div className="flex justify-between"><span>Documents (Meta):</span> <span className="font-bold">{currentData.documents.length} records</span></div>
          </div>

          <button 
            onClick={handleBackup}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-200"
          >
             <FileJson className="w-5 h-5" /> Tải Xuống Bản Sao Lưu
          </button>
        </div>

        {/* Restore Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col h-full">
          <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mb-4">
             <Upload className="w-6 h-6 text-purple-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Khôi Phục Hệ Thống</h3>
          <p className="text-sm text-gray-500 mb-6 flex-1">
            Nhập dữ liệu từ file JSON đã sao lưu trước đó. Hệ thống sẽ cập nhật lại toàn bộ cơ sở dữ liệu dựa trên file này.
          </p>

          <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-lg mb-6 flex gap-3">
             <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0" />
             <p className="text-xs text-yellow-800">
               Hành động này sẽ ghi đè dữ liệu hiện tại. Hãy chắc chắn rằng bạn đã sao lưu dữ liệu mới nhất trước khi thực hiện.
             </p>
          </div>

          <input 
            type="file" 
            accept=".json"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileSelect}
          />

          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isRestoring}
            className={`w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-200 ${isRestoring ? 'opacity-70 cursor-wait' : ''}`}
          >
             {isRestoring ? (
               <>
                 <RefreshCw className="w-5 h-5 animate-spin" /> Đang Xử Lý...
               </>
             ) : (
               <>
                 <Server className="w-5 h-5" /> Chọn File Khôi Phục
               </>
             )}
          </button>
        </div>
      </div>
      
      <div className="mt-8 pt-8 border-t border-gray-100 text-center text-slate-400 text-sm">
         <div className="flex items-center justify-center gap-2 mb-2">
            <Database className="w-4 h-4" />
            <span>Database Version: 6.0</span>
         </div>
         <p>Hệ thống hỗ trợ Restore an toàn (Upsert Mode) để tránh mất mát dữ liệu không mong muốn.</p>
      </div>
    </div>
  );
};