
import { Member, MemberRole, PaymentStatus, GiraEvent, Activity } from './types';

export const INITIAL_MEMBERS: Member[] = [
  {
    id: '1',
    name: 'Mariana Silva',
    orixa: 'Filha de Oxum',
    role: MemberRole.YAO,
    status: PaymentStatus.EM_DIA,
    active: true,
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuADgWqLdBWVEYyUjbzfXt56UqJZKA-Dj7EhnwovCeBYxQJa8CqYX32QZQvtPrX5sFf7DGvWtxUruIfqYBqt2PowwQZAA2yti-IpV1j9-sTwoZZqcbX3BE4L7YWrVDlIluwsryGzCmlwVu0vicHM2tfyvFGPaEmwiN1ntk-KUfAcN_C_rkBpDuqk_bdl5dWHVODa_GTbRx2r2j0OTL0wIrnR67XCPtRM4OjDtf3jApBbeIjSGafF7llOKxpXW-HAav7KTDiy3GY-3A'
  },
  {
    id: '2',
    name: 'João Santos',
    orixa: 'Filho de Ogum',
    role: MemberRole.OGA,
    status: PaymentStatus.PENDENTE,
    active: true
  },
  {
    id: '3',
    name: 'Carlos Oliveira',
    orixa: 'Abian',
    role: MemberRole.MEMBRO,
    status: PaymentStatus.ISENTO,
    active: true,
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAoHtznKN-LSRj-bx9Zr9MP9IIKRpfFMmfjpsYT54ZuQthiTTxMQ-sXfikYvrEJ_dkTQdecU3jkResBl0PC-d8Bc69Z6-smlYTEufKQuAWbP1KZmoHL74I9HUxZmxo1cKZlK32VskWKI04meczaUWLXaSNkosFyPebEyNBziXBPtObeM6Y7V64aaZNgxObEEt_W1VBkndj_gDJTIm--NnQZcbmU8M-JjAjjLE09N1-pDO5lu_QXwfohB0cCMsWL24xcySYuVy_N8Q'
  },
  {
    id: '4',
    name: 'Ana Pereira',
    orixa: 'Filha de Iemanjá',
    role: MemberRole.EKEDI,
    status: PaymentStatus.EM_DIA,
    active: true
  },
  {
    id: '5',
    name: 'Lucas Souza',
    orixa: 'Filho de Xangô',
    role: MemberRole.OGA,
    status: PaymentStatus.ATRASADO,
    active: false,
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC20ihPVQvfxluIfKj_UFdVmJbEBAk7138jKvAEyAdoOGd5s8G5VQbH-ci307h5gkSaGMGBGiJfbxurg0rCYEp2Nrl5AoAbE9TqBvWV8cWYKZkJM0vH8DwGl9RrN137EihjC7MXphKDOXhFHrJxBsrmDNFa_ezksq1UkxKrxz1RRdbPQkY7Go7rdQKQrXkAJsRqVxetnm-b2aHKZf_OCZoalwZMc02j5d57qlKSWaYGQdxKOS9TEubZsPFqNwGAAy1ySKTSwbcY9A'
  }
];

export const RECENT_ACTIVITIES: Activity[] = [
  {
    id: 'a1',
    user: 'Mariana de Oxum',
    action: 'pagou a mensalidade de Agosto.',
    time: 'Há 2 horas',
    amount: 150,
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAS4uK0X22enUdWDIneJnGjsN9kLA4vxTilXtOYxPwWzD7cQbvdLkvxtZ49venWeNtqHuXfNXo900QsW6nfnQSmx5r5EORPnCxr6OLOi5BLI0jOsIdtU7Kvz4-CrieY1hYuvCQ7f5y6rzyODlwsbff-m5tdmHK6jRzf1Nm7ZHnBuOVFRmXvOjGszESAQRe8eW2UIOdbijGQN_mxsR7xj_93cRFHFoVuIt0P2bblwNf_wYU0yoAC7d5RSFK9g4hZ-cbsr4zHDZqUgQ'
  },
  {
    id: 'a2',
    user: 'Carlos de Ogum',
    action: 'atualizou seu cadastro.',
    time: 'Há 5 horas',
    avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA672MaTDcNtPs6kPUx4Nc5MEAg07MXC1PVYZtKJDPK_jH9GUQvDG8BmJNP_zwyckaBxJLla6oWBCDztJWaJmDErxRZ0tx37nujF_vQnqUgq2Nd8VfEIImpguZ4Z7YjVT6aLURUauNJn0M___OXVdxYVK9bE2jB7GMTSrknHAn-E7a0p9H4Ff7i89JpbV_NaosLtiP3rxCsNxPAT2y4dnJbCqdeqCYWOdjgVUEwh1XubR8ac8ZBqpn3F4YxoZPmcUPduDtfnnKz7w'
  }
];

export const UPCOMING_GIRAS: GiraEvent[] = [
  {
    id: 'g1',
    title: 'Toque de Oxóssi',
    date: '24 Ago',
    time: '19:00',
    type: 'Firmeza',
    description: 'Obrigação Aberta'
  },
  {
    id: 'g2',
    title: 'Gira de Pretos Velhos',
    date: '30 Ago',
    time: '19:30',
    type: 'Caridade',
    description: 'Atendimento Público'
  }
];

export const IMAGES = {
  HERO: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDWymH3VopBPAg4AGFVd2tojESgEMS9tjRNaQGGDBVmsH28kBUkJdutv73qdVWhD5_4b7dTg8S21jQixFbYg6jqvZQsSofCh03HxhM8m972XJ7_8UQaBel8AWtBuvDNzOf1h2PlrFklj9VAETLXw02pQSBtgv6iL4soiqox0Er8Vt0FKfQCQ2WHuny48-fw4nGE8uGxFdzxAfQoVuh5pMmzw79d9NmHxYV3AmpomxBQX3SxlPnVXQa4Lz9NpIIm3IFBK_PPxyHNUQ',
  PAI_ANTONIO: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAVHBtri-Qx0XnL2kMBqr-rCc5BvDhKGZSbH2KMg0B5FUdPGF-wI-lAJ07EN31q2B2d7sFLA0AmZ7RJCwWq1hlDVhrSc-zmpLmFUdnnPw4rE3r9SjFp_lCSAsHGxorqNajWO8XuZyAUoVhLLRWO5-J5a4omfR2OkCOlTuqq9J5TcKd-jgxmHeRyC5pGBfHJQfCuLjJX470Cq1-YMB_TISORqWnD4I0C9zwxJhonBtNQyJEYGRzHco7xkmhpMlw2i_6i7Di3WdM_yg',
  FOREST_LOGIN: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCQbM8aSQtOfRDCgGhYUlmB-ltsx1lbEjOK8YAawwF4UoXzeJtcFgjFreR8SQ5goDSUv3ZtSNnONICzfKkXMMfwD88NrUt252RT_qmx1qa5n9p2b9cqUx1FUVUh_4JkplN5EjPOj3HYHpotoVmUME1poaRPdTG8eeFG8iNXtNMnciD-PuZPMlhD8ZSjGTG5UoXMaUOlfugWv1RlNdzTDv8yKE56opm0qRKM_8HT7ry2BozdhhjnhDiJAMrt_Ja0mdVrisKNOfu7rw',
  ALTAR: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDk7g37O80k9zz3F3ECCzeg7Xe-dOvXHFx7KSGAh83Pq1YmtxkKqjShtxlmvkIUsX2Gn9iKlZms4yA4Wl_-7YPVSpxcXLmU7kwTZ5Y0QtThdonIdcMk2k-blrQ9dpCFf-iP3FWRH51BwEpW7zfUP7E_Fg9DvgtA527tlcl91KieICLU0M_MqBpmVF6qfojiRPAqWXHMKMP9rVude2t4JWBC54nWPtUlzu2byoSc2tIjUae_xoofDbFwAg0yULungnJYP6zf-CDjGg',
  LEAF_PATTERN: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBv5IHxa1vwSwQKRXej_17aZYyhFt4GOGoaaSfawSuBw7s4iUDD0Opst78hW7QRAOPnNCHlotM5e0lWPNBln9VZ_EmIm7k_-ZJnHF1Zb_04w_-BS20V-XdvHgOlMriq3o-OPH-QtkT91l4aoTONB6yZyc-u3OlFWNXEZKJhFdDxkXcq0eIUWSVslen_ZNM6n9Rvx_cx_-Wenq1RIRpfSMuXgw674dYCKHdfgjkwWhDEkaSuf_9sTfFv_RhiOElMOGY8ZVrsVvj0Dw'
};
