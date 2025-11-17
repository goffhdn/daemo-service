// src/i18n/strings.js
export const STR = {
  en: {
    app_title: "DAEMO Service",
    app_sub: "Equipment Support",

    nav_request: "DAEMO Service Application",
    nav_my: "My Requests",
    nav_dash: "Service Dashboard",

    you_not_signed_in: "You are not signed in.",
    sign_in: "Sign In",
    sign_out: "Sign Out",

    head_request: "DAEMO Service Application",
    head_my: "My Requests",
    head_dash: "Service Dashboard",
    head_sub_request: "Complete all required fields to submit your service request",
    head_sub_dash: "Manage and track all service requests",

    // Request form
    info_need_signin: "Please sign in first to submit.",
    info_signed_in_as: "Signed in as",
    required_left: "Required left",

    customer_info: "Customer Info",
    country: "Country",
    name_company_required: "Name or Company (Required)",
    contact_required: "Contact (Required)",

    attach_info: "Attachment Info",
    attach_type_required: "Attachment Type (Required)",
    model_required: "Model (Required)",
    serial_no: "Serial No.",

    failure_details: "Failure Details",
    installed_at: "Installed At",
    failed_at: "Failed At",
    symptom_required: "Symptom (Required)",
    attachments_title: "Attachments (JPG/PNG/PDF/MP4)",
    per_file_limit: "Per file limit",
    submit: "Submit",
    submitting: "Submitting...",
    removed: "Remove",

    // Toast/validation
    some_files_rejected: "Some files were rejected.",
    please_sign_in: "Please sign in first.",
    please_fill_required: "Please fill required fields",
    submitted_ok: "Submitted successfully.",

    // Dashboard
    kpi_total: "Total",
    kpi_received: "Received",
    kpi_in_progress: "In Progress",
    kpi_on_hold: "On Hold",
    kpi_completed: "Completed",
    completion_rate: "% Completion Rate",
    completion_desc: "Ratio of completed tickets to all non-cancelled tickets.",
    all_requests: "All Service Requests",
    refresh: "Refresh",
    no_requests: "No requests.",
    actions: "Actions",
    set: "Set",

    // Table cols
    th_id: "#",
    th_customer: "Customer",
    th_equipment: "Equipment",
    th_status: "Status",
    th_created: "Created At",

    // Status labels
    st_received: "Received",
    st_in_progress: "In Progress",
    st_completed: "Completed",
    st_on_hold: "On Hold",
    st_cancelled: "Cancelled",

    // Confirm
    confirm_title: "Change Status",
    confirm_msg: `Change the status to "{{status}}"?`,
    confirm_ok: "OK",
    confirm_cancel: "Cancel",
  },

  ko: {
    app_title: "DAEMO Service",
    app_sub: "Equipment Support",

    nav_request: "DAEMO 서비스 신청",
    nav_my: "내 요청",
    nav_dash: "서비스 대시보드",

    you_not_signed_in: "로그인되어 있지 않습니다.",
    sign_in: "로그인",
    sign_out: "로그아웃",

    head_request: "DAEMO 서비스 신청",
    head_my: "내 요청",
    head_dash: "서비스 대시보드",
    head_sub_request: "서비스 요청 제출을 위해 필수 항목을 모두 입력하세요",
    head_sub_dash: "모든 서비스 요청을 관리하고 추적합니다",

    // Request form
    info_need_signin: "제출하려면 먼저 로그인하세요.",
    info_signed_in_as: "로그인 계정",
    required_left: "남은 필수 항목",

    customer_info: "고객 정보",
    country: "국가",
    name_company_required: "이름 또는 회사명 (필수)",
    contact_required: "연락처 (필수)",

    attach_info: "장비(부착물) 정보",
    attach_type_required: "부착물 종류 (필수)",
    model_required: "모델 (필수)",
    serial_no: "시리얼 번호",

    failure_details: "고장 상세",
    installed_at: "설치 일자",
    failed_at: "고장 일자",
    symptom_required: "증상 (필수)",
    attachments_title: "첨부 파일 (JPG/PNG/PDF/MP4)",
    per_file_limit: "파일당 제한",
    submit: "제출",
    submitting: "제출 중...",
    removed: "삭제",

    // Toast/validation
    some_files_rejected: "일부 파일이 거부되었습니다.",
    please_sign_in: "먼저 로그인하세요.",
    please_fill_required: "필수 항목을 입력하세요",
    submitted_ok: "정상적으로 제출되었습니다.",

    // Dashboard
    kpi_total: "전체",
    kpi_received: "접수",
    kpi_in_progress: "진행중",
    kpi_on_hold: "대기",
    kpi_completed: "완료",
    completion_rate: "% 완료율",
    completion_desc: "취소를 제외한 요청 중 완료된 요청의 비율",
    all_requests: "전체 서비스 요청",
    refresh: "새로고침",
    no_requests: "요청이 없습니다.",
    actions: "작업",
    set: "변경",

    // Table cols
    th_id: "#",
    th_customer: "고객",
    th_equipment: "장비",
    th_status: "상태",
    th_created: "생성일",

    // Status labels
    st_received: "접수",
    st_in_progress: "진행중",
    st_completed: "완료",
    st_on_hold: "대기",
    st_cancelled: "취소",

    // Confirm
    confirm_title: "상태 변경",
    confirm_msg: `상태를 "{{status}}"(으)로 변경할까요?`,
    confirm_ok: "확인",
    confirm_cancel: "취소",
  },
};
