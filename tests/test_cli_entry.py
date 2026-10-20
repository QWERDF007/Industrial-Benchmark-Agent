import json
import pytest
from iad_core.entry import dispatch_request, OPERATIONS


def test_cli_entry_tool_call(monkeypatch):
    emitted = []
    monkeypatch.setattr("iad_core.entry.emit", lambda p: emitted.append(p))

    dispatch_request({
        "request_id": "req_tc",
        "operation": "tool_call",
        "arguments": {
            "tool_name": "task_inspect",
            "arguments": {"task_id": "kuangjiao_inspection_01"}
        }
    })

    assert len(emitted) == 1
    res = emitted[0]
    assert res["event"] == "result"
    assert res["request_id"] == "req_tc"
    assert res["status"] == "OK"
    assert "metrics" in res


def test_cli_entry_tool_contract_error(monkeypatch):
    emitted = []
    monkeypatch.setattr("iad_core.entry.emit", lambda p: emitted.append(p))

    dispatch_request({
        "request_id": "req_err",
        "operation": "tool_call",
        "arguments": {
            "tool_name": "task_inspect",
            "arguments": {"invalid_param": 123}
        }
    })

    assert len(emitted) == 1
    res = emitted[0]
    assert res["event"] == "error"
    assert res["error"]["code"] == "CONTRACT_ERROR"


def test_cli_entry_dataset_list(monkeypatch):
    emitted = []
    monkeypatch.setattr("iad_core.entry.emit", lambda p: emitted.append(p))

    dispatch_request({
        "request_id": "req_dl",
        "operation": "dataset_list",
        "arguments": {}
    })

    assert len(emitted) == 1
    res = emitted[0]
    assert res["event"] == "result"
    assert "tasks" in res["data"]


def test_cli_entry_sample_list(monkeypatch):
    emitted = []
    monkeypatch.setattr("iad_core.entry.emit", lambda p: emitted.append(p))

    dispatch_request({
        "request_id": "req_sl",
        "operation": "sample_list",
        "arguments": {
            "task_id": "kuangjiao_inspection_01",
            "page": 1,
            "page_size": 5
        }
    })

    assert len(emitted) == 1
    res = emitted[0]
    assert res["event"] == "result"
    assert res["data"]["total"] > 0
    assert len(res["data"]["items"]) <= 5


def test_cli_entry_review_queue(monkeypatch):
    emitted = []
    monkeypatch.setattr("iad_core.entry.emit", lambda p: emitted.append(p))

    dispatch_request({
        "request_id": "req_rq",
        "operation": "review_queue",
        "arguments": {
            "task_id": "kuangjiao_inspection_01",
            "page": 1,
            "page_size": 2
        }
    })

    assert len(emitted) == 1
    res = emitted[0]
    assert res["event"] == "result"
    assert res["data"]["total_candidates"] > 0


def test_cli_entry_sample_get(monkeypatch):
    emitted = []
    monkeypatch.setattr("iad_core.entry.emit", lambda p: emitted.append(p))

    dispatch_request({
        "request_id": "req_sg",
        "operation": "sample_get",
        "arguments": {
            "sample_id": "kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Test/2022_08_19_13_15_15_853269.png"
        }
    })

    assert len(emitted) == 1
    res = emitted[0]
    assert res["event"] == "result"
    assert "sample" in res["data"]


def test_cli_entry_sample_image_path(monkeypatch):
    emitted = []
    monkeypatch.setattr("iad_core.entry.emit", lambda p: emitted.append(p))

    dispatch_request({
        "request_id": "req_sip",
        "operation": "sample_image_path",
        "arguments": {
            "sample_id": "kuangjiao_dataset:ExportImage_框胶10x连线蓝色背面厚_0904-Test/2022_08_19_13_15_15_853269.png"
        }
    })

    assert len(emitted) == 1
    res = emitted[0]
    assert res["event"] == "result"
    assert "path" in res["data"]
    assert res["data"]["exists"] is True


def test_cli_entry_report_get(monkeypatch):
    emitted = []
    monkeypatch.setattr("iad_core.entry.emit", lambda p: emitted.append(p))

    dispatch_request({
        "request_id": "req_rg",
        "operation": "report_get",
        "arguments": {
            "task_id": "kuangjiao_inspection_01"
        }
    })

    assert len(emitted) == 1
    res = emitted[0]
    assert res["event"] == "result"
    assert "vlm_audited_count" in res["data"]
