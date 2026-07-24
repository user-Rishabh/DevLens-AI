import pytest
from app.analysis.blast_radius import compute_blast_radius

def test_blast_radius_basic_and_transitive():
    # Setup mock dependency edges:
    # utils.py is imported by auth.py
    # auth.py is imported by routes.py
    # routes.py is imported by main.py
    dependencies = [
        {"from": "app/auth.py", "to": "app/utils.py"},
        {"from": "app/routes.py", "to": "app/auth.py"},
        {"from": "app/main.py", "to": "app/routes.py"}
    ]

    res = compute_blast_radius(
        repo_id="test_repo",
        file_path="app/utils.py",
        max_depth=3,
        dependencies=dependencies
    )

    assert res["file_path"] == "app/utils.py"
    assert res["direct_dependents"] == ["app/auth.py"]
    assert len(res["transitive_dependents"]) == 2
    
    # Check depth 2
    dep_depth2 = [d for d in res["transitive_dependents"] if d["depth"] == 2]
    assert len(dep_depth2) == 1
    assert dep_depth2[0]["file_path"] == "app/routes.py"
    assert dep_depth2[0]["path"] == ["app/utils.py", "app/auth.py", "app/routes.py"]

    # Check depth 3
    dep_depth3 = [d for d in res["transitive_dependents"] if d["depth"] == 3]
    assert len(dep_depth3) == 1
    assert dep_depth3[0]["file_path"] == "app/main.py"
    assert dep_depth3[0]["path"] == ["app/utils.py", "app/auth.py", "app/routes.py", "app/main.py"]

    assert res["total_affected_count"] == 3

def test_blast_radius_max_depth_cutoff():
    dependencies = [
        {"from": "app/auth.py", "to": "app/utils.py"},
        {"from": "app/routes.py", "to": "app/auth.py"},
        {"from": "app/main.py", "to": "app/routes.py"}
    ]

    res = compute_blast_radius(
        repo_id="test_repo",
        file_path="app/utils.py",
        max_depth=1,
        dependencies=dependencies
    )

    assert res["direct_dependents"] == ["app/auth.py"]
    assert res["transitive_dependents"] == []
    assert res["total_affected_count"] == 1

def test_blast_radius_zero_dependents():
    dependencies = [
        {"from": "app/auth.py", "to": "app/utils.py"}
    ]

    res = compute_blast_radius(
        repo_id="test_repo",
        file_path="app/auth.py",
        max_depth=3,
        dependencies=dependencies
    )

    assert res["file_path"] == "app/auth.py"
    assert res["direct_dependents"] == []
    assert res["transitive_dependents"] == []
    assert res["total_affected_count"] == 0

def test_blast_radius_circular_dependency():
    # A -> B -> C -> A
    dependencies = [
        {"from": "app/b.py", "to": "app/a.py"},
        {"from": "app/c.py", "to": "app/b.py"},
        {"from": "app/a.py", "to": "app/c.py"}
    ]

    res = compute_blast_radius(
        repo_id="test_repo",
        file_path="app/a.py",
        max_depth=5,
        dependencies=dependencies
    )

    # From a.py:
    # Direct dependent: b.py
    # Transitive dependent: c.py (depth 2)
    # a.py is visited, so no infinite loop
    assert res["direct_dependents"] == ["app/b.py"]
    assert len(res["transitive_dependents"]) == 1
    assert res["transitive_dependents"][0]["file_path"] == "app/c.py"
    assert res["total_affected_count"] == 2

if __name__ == "__main__":
    test_blast_radius_basic_and_transitive()
    test_blast_radius_max_depth_cutoff()
    test_blast_radius_zero_dependents()
    test_blast_radius_circular_dependency()
    print("All blast radius unit tests passed successfully!")
